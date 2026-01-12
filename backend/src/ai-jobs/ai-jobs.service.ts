import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartAiTailoringDto, StartAiTailoringResponseDto, AiJobStatusDto, AiJobListItemDto } from './dto/ai-job.dto';
import { SectionsService } from '../versions/sections.service';
import { LatexParserService } from '../versions/latex-parser.service';
import { SectionType } from '../versions/dto/section.dto';
import { SectionProposal } from './dto/proposal.dto';
import { SendChatDto, ChatResponseDto } from './dto/chat.dto';
import OpenAI from 'openai';

/**
 * AI Jobs Service
 * 
 * PHASE 5: AI JOB INFRASTRUCTURE (NO REWRITING)
 * PHASE 6: AI RESUME TAILORING (PROPOSAL ONLY)
 * GOAL 3: Section-aware AI proposals
 * 
 * - Real database operations
 * - Ownership enforcement
 * - Section-level AI processing
 * - Locked sections excluded from AI prompts
 * 
 * From apis.md Section 6
 */
@Injectable()
export class AiJobsService {
  private readonly aiClient: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sectionsService: SectionsService,
    private readonly latexParser: LatexParserService,
  ) {
    // Initialize Nebius AI client
    this.aiClient = new OpenAI({
      baseURL: 'https://api.tokenfactory.nebius.com/v1/',
      apiKey: process.env.NEBIUS_API_KEY,
      timeout: 30000, // 30 second timeout
      maxRetries: 2,
    });
  }
  /**
   * Start AI tailoring job
   * From apis.md Section 6.1
   * 
   * PHASE 5: Database persistence ONLY
   * - Creates AIJob entity with status=QUEUED
   * - Verifies user owns project, baseVersion, and JD
   * - NO AI execution (placeholder for future phase)
   * 
   * Rules from apis.md:
   * - Async only (no blocking responses)
   * - Frontend polls for status
   */
  async startTailoring(
    startTailoringDto: StartAiTailoringDto,
    userId: string,
  ): Promise<StartAiTailoringResponseDto> {
    const { projectId, baseVersionId, jdId, mode, userInstructions } = startTailoringDto;

    // Verify user owns the project
    const project = await this.prisma.resumeProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Verify baseVersion exists and belongs to the project
    const baseVersion = await this.prisma.resumeVersion.findUnique({
      where: { id: baseVersionId },
    });

    if (!baseVersion) {
      throw new NotFoundException(`Version ${baseVersionId} not found`);
    }

    if (baseVersion.projectId !== projectId) {
      throw new ForbiddenException('Version does not belong to this project');
    }

    // Verify JD exists and belongs to the project (if provided)
    let jd = null;
    if (jdId) {
      jd = await this.prisma.jobDescription.findUnique({
        where: { id: jdId },
      });

      if (!jd) {
        throw new NotFoundException(`Job description ${jdId} not found`);
      }

      if (jd.projectId !== projectId) {
        throw new ForbiddenException('Job description does not belong to this project');
      }
    }

    // Create AIJob with status=QUEUED
    const aiJob = await this.prisma.aIJob.create({
      data: {
        projectId,
        baseVersionId,
        jdId: jdId || null,
        mode,
        status: 'QUEUED',
        errorMessage: null,
      },
    });

    // PHASE 6: Execute AI job immediately (synchronous for now)
    // TODO: Move to background queue in future phase
    await this.executeAiJob(aiJob.id, userInstructions);

    return {
      jobId: aiJob.id,
    };
  }

  /**
   * Execute AI job and generate proposed resume
   * PHASE 6: AI RESUME TAILORING (PROPOSAL ONLY)
   * GOAL 3: Section-aware AI processing
   * 
   * Process:
   * 1. Extract sections from base version (lazy extraction if needed)
   * 2. Filter to only unlocked sections
   * 3. Send only unlocked sections to AI (locked sections excluded)
   * 4. AI returns per-section modifications
   * 5. Store section-level proposals
   * 6. Assemble full LaTeX for backward compatibility
   * 
   * Guarantees:
   * - Locked sections NEVER sent to AI
   * - Locked sections preserved byte-for-byte in proposal
   * - Section-level diff enables granular accept/reject
   * 
   * @param jobId - AI job ID
   * @param userInstructions - Optional custom instructions from Edit Mode
   */
  private async executeAiJob(jobId: string, userInstructions?: string): Promise<void> {
    try {
      // Update status to RUNNING
      await this.prisma.aIJob.update({
        where: { id: jobId },
        data: { status: 'RUNNING' },
      });

      // Load AIJob with relations
      const aiJob = await this.prisma.aIJob.findUnique({
        where: { id: jobId },
        include: {
          baseVersion: true,
          jd: true,
        },
      });

      if (!aiJob) {
        throw new Error('AIJob not found');
      }

      // GOAL 3: Extract sections from base version (triggers lazy extraction if needed)
      const allSections = await this.sectionsService.extractAndStoreSections(
        aiJob.baseVersionId,
      );

      // GOAL 3: Get only unlocked sections for AI processing
      const unlockedSections = await this.sectionsService.getUnlockedSections(
        aiJob.baseVersionId,
      );

      if (unlockedSections.length === 0) {
        // No unlocked sections - nothing for AI to modify
        throw new Error('No unlocked sections available for AI modification');
      }

      // GOAL 3: Generate section-level proposals
      const sectionProposals = await this.generateSectionProposals(
        unlockedSections,
        allSections,
        aiJob.jd?.rawText || null,
        aiJob.mode,
        userInstructions,
      );

      // GOAL 3: Assemble full LaTeX with proposed changes
      const proposedLatexContent = await this.assembleProposedLatex(
        aiJob.baseVersionId,
        sectionProposals,
      );

      // Store proposal in ProposedVersion table
      await this.prisma.proposedVersion.upsert({
        where: { aiJobId: jobId },
        create: {
          aiJobId: jobId,
          proposedLatexContent,
          sectionProposals: JSON.parse(JSON.stringify(sectionProposals)), // Convert to plain object
        },
        update: {
          proposedLatexContent,
          sectionProposals: JSON.parse(JSON.stringify(sectionProposals)),
        },
      });

      // Update AIJob status to COMPLETED
      await this.prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          errorMessage: null,
        },
      });
    } catch (error) {
      // Update AIJob status to FAILED
      await this.prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Generate proposed resume content
   * PHASE 9: REAL AI IMPLEMENTATION (Nebius AI)
   * 
   * Uses Nebius AI API (OpenAI-compatible) to tailor resume
   * Based on job description and optimization mode
   */
  private async generateProposedResume(
    baseLatexContent: string,
    jdRawText: string,
    mode: string,
  ): Promise<string> {
    try {
      // Build mode-specific instructions
      const modeInstructions = this.getModeInstructions(mode);

      // System prompt: Define AI behavior and constraints
      const systemPrompt = `You are an expert resume optimization assistant specializing in LaTeX resume tailoring.

Your task:
- Analyze the provided job description
- Modify the LaTeX resume to align with the job requirements
- Preserve ALL LaTeX structure, formatting, and commands
- Only modify content (text within LaTeX commands), NEVER change LaTeX syntax
- Focus on: relevant skills, experience framing, keyword optimization

Constraints:
- Output ONLY valid LaTeX code
- Do NOT add explanations or markdown
- Do NOT change document class, packages, or formatting
- Do NOT invent experience or skills
- Do NOT remove sections entirely

${modeInstructions}`;

      // User prompt: Provide context and specific request
      const userPrompt = `Base Resume (LaTeX):
\`\`\`latex
${baseLatexContent}
\`\`\`

Job Description:
\`\`\`
${jdRawText}
\`\`\`

Please generate an optimized version of this resume tailored for the above job description. Return ONLY the complete LaTeX code.`;

      // Call Nebius AI API
      const response = await this.aiClient.chat.completions.create({
        model: 'deepseek-ai/DeepSeek-V3-0324-fast',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      // Extract generated content
      const proposedLatexContent = response.choices[0]?.message?.content;

      if (!proposedLatexContent) {
        throw new Error('AI service returned empty response');
      }

      // Clean up response (remove markdown code blocks if present)
      const cleanedContent = this.cleanAIResponse(proposedLatexContent);

      return cleanedContent;
    } catch (error) {
      // Log error details
      console.error('AI resume generation failed:', error);

      // Re-throw with user-friendly message
      throw new Error(
        `Failed to generate AI proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get mode-specific instructions for AI
   */
  private getModeInstructions(mode: string): string {
    switch (mode) {
      case 'MINIMAL':
        return `Optimization Level: MINIMAL
- Make only small, targeted changes
- Focus on keyword alignment
- Preserve original phrasing as much as possible
- Change only 10-20% of content`;

      case 'BALANCED':
        return `Optimization Level: BALANCED
- Moderate content rewriting
- Reframe bullet points to match job requirements
- Add relevant technical keywords
- Change 30-50% of content`;

      case 'AGGRESSIVE':
        return `Optimization Level: AGGRESSIVE
- Extensive content optimization
- Rewrite most descriptions to align with JD
- Maximize keyword density
- Reorder sections if beneficial
- Change 50-70% of content`;

      default:
        return 'Optimization Level: BALANCED';
    }
  }

  /**
   * Clean AI response to extract pure LaTeX
   * Removes markdown code blocks and extra formatting
   */
  private cleanAIResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```latex\n?/g, '').replace(/```\n?/g, '');

    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Validate LaTeX syntax to prevent compilation errors
   * Checks for common LaTeX errors that would cause compilation failure
   * 
   * Returns true if errors detected, false if content appears valid
   * 
   * NOTE: This validation is intentionally permissive for section content
   * since sections may not have \section{} headers (they're extracted separately)
   */
  private hasLaTeXSyntaxErrors(content: string): boolean {
    try {
      // Check 1: Balanced braces (critical for LaTeX)
      let braceCount = 0;
      for (const char of content) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (braceCount < 0) {
          console.warn('LaTeX validation failed: More closing braces than opening');
          return true;
        }
      }
      if (braceCount !== 0) {
        console.warn(`LaTeX validation failed: Unbalanced braces (count: ${braceCount})`);
        return true;
      }

      // Check 2: No markdown artifacts (AI sometimes includes these)
      if (content.includes('```')) {
        console.warn('LaTeX validation failed: Contains markdown code blocks');
        return true;
      }
      
      // Check 3: No obvious AI refusal messages
      if (content.includes('I cannot') || content.includes("I can't") || content.includes('I am unable')) {
        console.warn('LaTeX validation failed: Contains AI refusal message');
        return true;
      }

      // Check 4: Balanced square brackets (for optional arguments)
      let bracketCount = 0;
      for (const char of content) {
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
        if (bracketCount < 0) {
          console.warn('LaTeX validation failed: Unbalanced square brackets');
          return true;
        }
      }
      if (bracketCount !== 0) {
        console.warn(`LaTeX validation failed: Unbalanced square brackets (count: ${bracketCount})`);
        return true;
      }

      // NOTE: We do NOT check for \section{} commands here because:
      // - Section content is extracted WITHOUT section headers
      // - The section header is preserved separately and added back during assembly

      return false; // No errors detected
    } catch (error) {
      console.error('LaTeX validation error:', error);
      return true; // Assume invalid on validation error
    }
  }

  // ============================================
  // GOAL 3: Section-Aware AI Processing
  // ============================================

  /**
   * Generate AI proposals for each unlocked section
   * 
   * CRITICAL: Only unlocked sections are sent to AI
   * - Locked sections never included in AI prompt
   * - AI returns per-section modifications
   * - Unchanged sections marked as 'unchanged'
   * 
   * @param unlockedSections - Sections AI can modify
   * @param allSections - All sections (for context/order)
   * @param jdRawText - Job description
   * @param mode - AI optimization mode
   */
  private async generateSectionProposals(
    unlockedSections: any[],
    allSections: any[],
    jdRawText: string | null,
    mode: string,
    userInstructions?: string,
  ): Promise<SectionProposal[]> {
    const proposals: SectionProposal[] = [];

    // Build section-specific prompts for each unlocked section
    for (let i = 0; i < allSections.length; i++) {
      const section = allSections[i];
      const isLocked = section.isLocked;
      const sectionType = section.sectionType as SectionType;

      if (isLocked) {
        // Locked section: mark as unchanged
        proposals.push({
          sectionType,
          before: section.content,
          after: section.content, // No change
          changeType: 'unchanged',
        });
      } else {
        // Add small delay between AI calls to avoid rate limiting (except for first call)
        if (i > 0 && proposals.some(p => p.changeType === 'modified')) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Unlocked section: send to AI
        const modifiedContent = await this.generateSectionContent(
          section.content,
          sectionType,
          jdRawText,
          mode,
          userInstructions,
        );

        proposals.push({
          sectionType,
          before: section.content,
          after: modifiedContent,
          changeType: modifiedContent !== section.content ? 'modified' : 'unchanged',
        });
      }
    }

    return proposals;
  }

  /**
   * Generate AI-optimized content for a single section
   * 
   * Sends only this section's content to AI (not full resume)
   * This enables section-level isolation and better prompt control
   * 
   * @param userInstructions - Custom instructions from Edit Mode (optional)
   */
  private async generateSectionContent(
    originalContent: string,
    sectionType: SectionType,
    jdRawText: string | null,
    mode: string,
    userInstructions?: string,
  ): Promise<string> {
    try {
      const modeInstructions = this.getModeInstructions(mode);

      // Build custom instructions context if provided
      const customInstructionsContext = userInstructions 
        ? `\n\nUSER CUSTOM INSTRUCTIONS (HIGHEST PRIORITY):\n${userInstructions}\n\nFollow these custom instructions while maintaining LaTeX safety rules.`
        : '';

      const systemPrompt = `You are an expert resume optimization assistant specializing in tailoring resume sections for specific job descriptions.

Your task: Optimize the ${sectionType} section of a resume${jdRawText ? ' to better match a job description' : ''}.

${modeInstructions}${customInstructionsContext}

OPTIMIZATION GUIDELINES:
1. **JD Alignment:** Adjust content to reflect the job description's skills and experience requirements.
2. **Maintain Length:** Do NOT increase the overall length. Keep it as concise as the original.
3. **Preserve Header/Education:** NEVER modify header sections or education sections. Leave irrelevant sections untouched.
4. **Quantify Impact:** Add measurable results where possible without adding fluff.
5. **Diverse Verbs:** Use varied action verbs and avoid generic buzzwords like "leveraged", "utilized".
6. **ATS-Friendly:** Ensure output remains easily readable by Applicant Tracking Systems.

CRITICAL LATEX PRESERVATION RULES (MUST FOLLOW):
1. NEVER remove or modify ANY LaTeX commands (\\section, \\textbf, \\href, \\item, etc.)
2. NEVER add new LaTeX commands or packages
3. PRESERVE all special characters and escape sequences (\\&, \\%, \\$, etc.)
4. PRESERVE exact structure: if input has \\section{Title}, output MUST have \\section{Title}
5. PRESERVE all formatting commands (\\textit, \\textbf, \\emph, etc.)
6. ONLY modify the TEXT CONTENT between commands, not the commands themselves
7. If the section uses custom commands (\\cventry, \\resumeSubheading, etc.), PRESERVE them exactly
8. Return ONLY valid LaTeX code - no markdown, no explanations
9. Maintain exact indentation and spacing where possible

WHAT YOU CAN CHANGE:
- Descriptions of responsibilities and achievements
- Technical keywords and skills (match JD terminology)
- Action verbs and metrics
- Bullet point content

WHAT YOU MUST NEVER CHANGE:
- Any text starting with backslash (\\)
- Curly braces structure: { }
- Square brackets: [ ]
- Special characters: &, %, $, #, _, {, }, ~, ^, \\
- Section headers structure
- List environments (itemize, enumerate)
- Job titles or company names (keep factual)

IF UNCERTAIN: Return the original content unchanged rather than risk breaking LaTeX.`;

      const jdContext = jdRawText 
        ? `Job Description:\n\`\`\`\n${jdRawText}\n\`\`\`\n\n`
        : '';

      const userPrompt = `${jdContext}Current ${sectionType} Section:
\`\`\`latex
${originalContent}
\`\`\`

Optimize this section${jdRawText ? ' to better match the job description' : ''}. Return ONLY the LaTeX code for this section. Preserve ALL LaTeX commands exactly.`;

      // Call AI API with conservative settings
      console.log(`Calling AI for section: ${sectionType}, content length: ${originalContent.length}`);
      
      const response = await this.aiClient.chat.completions.create({
        model: 'deepseek-ai/DeepSeek-V3-0324-fast',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.5, // Lower temperature for more conservative output
        max_tokens: 2000,
      });

      const generatedContent = response.choices[0]?.message?.content;
      
      console.log(`AI response for ${sectionType}: ${generatedContent ? `${generatedContent.length} chars` : 'EMPTY'}`);

      if (!generatedContent) {
        // AI failed - return original
        console.warn(`AI returned empty response for ${sectionType}, using original`);
        return originalContent;
      }

      const cleanedContent = this.cleanAIResponse(generatedContent);
      
      // Validate LaTeX syntax before returning
      if (this.hasLaTeXSyntaxErrors(cleanedContent)) {
        console.warn(`AI generated invalid LaTeX for ${sectionType}, using original`);
        return originalContent;
      }

      // Safety check: If AI removed too much content, use original
      const originalCommands = (originalContent.match(/\\/g) || []).length;
      const generatedCommands = (cleanedContent.match(/\\/g) || []).length;
      
      if (generatedCommands < originalCommands * 0.7) {
        console.warn(`AI removed too many LaTeX commands for ${sectionType} (${generatedCommands} vs ${originalCommands}), using original`);
        return originalContent;
      }

      // Safety check: Ensure section header is preserved
      const originalHeader = originalContent.match(/\\(?:section|subsection)\*?\{[^}]+\}/);
      const generatedHeader = cleanedContent.match(/\\(?:section|subsection)\*?\{[^}]+\}/);
      
      if (originalHeader && !generatedHeader) {
        console.warn(`AI removed section header for ${sectionType}, using original`);
        return originalContent;
      }

      return cleanedContent;
    } catch (error) {
      // AI error - return original content (graceful degradation)
      console.error(`AI failed for section ${sectionType}:`, error);
      return originalContent;
    }
  }

  /**
   * Assemble full LaTeX document from section proposals
   * 
   * Uses SectionsService to reassemble with modifications
   * Locked sections use original content (guaranteed)
   */
  private async assembleProposedLatex(
    baseVersionId: string,
    sectionProposals: SectionProposal[],
  ): Promise<string> {
    // Build modifications map (only changed sections)
    const modifications = new Map<SectionType, string>();
    
    for (const proposal of sectionProposals) {
      if (proposal.changeType === 'modified') {
        modifications.set(proposal.sectionType, proposal.after);
      }
    }

    // Get all sections from base version
    const allSections = await this.sectionsService.extractAndStoreSections(baseVersionId);
    
    // Build locked sections set
    const lockedSections = new Set<SectionType>(
      allSections
        .filter(s => s.isLocked)
        .map(s => s.sectionType)
    );

    // Get base version to extract preamble/postamble
    const baseVersion = await this.prisma.resumeVersion.findUnique({
      where: { id: baseVersionId },
    });

    if (!baseVersion) {
      throw new Error('Base version not found');
    }

    // FIXED: Use proper LaTeX parser to preserve document structure
    const parsed = this.latexParser.extractSections(baseVersion.latexContent);
    
    // Assemble with modifications while preserving preamble/postamble
    const assembledLatex = this.latexParser.assembleWithModifications(
      parsed,
      modifications,
      lockedSections,
    );

    return assembledLatex;
  }

  /**
   * Assemble LaTeX from merged section proposals (selective acceptance)
   * GOAL 3: Support selective section acceptance
   * 
   * Takes section proposals where "after" field is either:
   * - AI-modified content (for accepted sections)
   * - Original content (for rejected sections)
   * 
   * Returns assembled LaTeX with merged changes
   * 
   * FIXED: Properly preserves preamble, postamble, and document structure
   */
  private assembleMergedLatex(
    mergedProposals: SectionProposal[],
    baseLatexContent: string,
  ): string {
    // Use LatexParserService to parse base document
    const parsed = this.latexParser.extractSections(baseLatexContent);
    
    // Build modifications map from merged proposals
    const modifications = new Map<SectionType, string>();
    for (const proposal of mergedProposals) {
      modifications.set(proposal.sectionType, proposal.after);
    }
    
    // Assemble with modifications (no locked sections since user already accepted/rejected)
    const assembledLatex = this.latexParser.assembleWithModifications(
      parsed,
      modifications,
      new Set<SectionType>(), // No locked sections in acceptance flow
    );

    return assembledLatex;
  }

  /**
   * Get AI job status
   * From apis.md Section 6.2
   * 
   * PHASE 5: Database retrieval ONLY
   * - Queries AIJob table
   * - Returns current status
   * - Verifies ownership via project relationship
   * 
   * Frontend behavior from apis.md:
   * - Poll until COMPLETED or FAILED
   */
  async getJobStatus(jobId: string, userId: string): Promise<AiJobStatusDto> {
    const aiJob = await this.prisma.aIJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!aiJob) {
      throw new NotFoundException(`AI job ${jobId} not found`);
    }

    // Verify ownership via project relationship
    if (aiJob.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this AI job');
    }

    return {
      jobId: aiJob.id,
      status: aiJob.status,
      newVersionId: null, // TODO: Link to created version in future phase
      errorMessage: aiJob.errorMessage,
    };
  }

  /**
   * Accept AI proposal and create new resume version
   * PHASE 6: Proposal acceptance
   * GOAL 3: Support selective section acceptance
   * 
   * Creates new AI_GENERATED ResumeVersion from ProposedVersion
   * Sets parentVersionId to baseVersionId
   * Returns new versionId
   * 
   * Supports selective section acceptance via acceptedSections param
   * If not provided, accepts all sections (full proposal)
   * 
   * Forbidden:
   * - No silent apply
   */
  async acceptProposal(
    acceptProposalDto: { aiJobId: string; projectId: string; acceptedSections?: SectionType[] },
    userId: string,
  ): Promise<{ newVersionId: string }> {
    // Verify ownership
    const project = await this.prisma.resumeProject.findFirst({
      where: {
        id: acceptProposalDto.projectId,
        userId,
      },
    });

    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    // Fetch AI job with proposed version
    const aiJob = await this.prisma.aIJob.findFirst({
      where: {
        id: acceptProposalDto.aiJobId,
        projectId: acceptProposalDto.projectId,
      },
      include: {
        proposedVersion: true,
        baseVersion: true,
      },
    });

    if (!aiJob) {
      throw new NotFoundException('AI job not found');
    }

    if (!aiJob.proposedVersion) {
      throw new NotFoundException('No proposal found for this job');
    }

    if (aiJob.status !== 'COMPLETED') {
      throw new BadRequestException('Job is not completed yet');
    }

    // GOAL 3: Determine final LaTeX content based on selective acceptance
    let finalLatexContent: string;

    if (acceptProposalDto.acceptedSections && acceptProposalDto.acceptedSections.length > 0) {
      // Selective acceptance: merge only accepted sections
      const sectionProposals = aiJob.proposedVersion.sectionProposals as unknown as SectionProposal[];
      
      // Build map of accepted sections
      const acceptedSet = new Set(acceptProposalDto.acceptedSections);
      
      // Merge sections: use "after" for accepted, "before" for rejected
      const mergedProposals = sectionProposals.map((proposal) => ({
        ...proposal,
        after: acceptedSet.has(proposal.sectionType as SectionType)
          ? proposal.after  // Accepted: use AI version
          : proposal.before, // Rejected: use original version
      }));

      // Assemble final LaTeX from merged sections with proper document structure
      finalLatexContent = this.assembleMergedLatex(mergedProposals, aiJob.baseVersion.latexContent);
    } else {
      // Full acceptance: use entire proposed LaTeX
      finalLatexContent = aiJob.proposedVersion.proposedLatexContent;
    }

    // CRITICAL FIX: Use transaction to atomically transfer ACTIVE status
    // - Demote current ACTIVE version to DRAFT
    // - Create new AI_GENERATED version as ACTIVE
    // - Delete proposal
    const newVersion = await this.prisma.$transaction(async (tx) => {
      // Step 1: Demote current ACTIVE version to DRAFT
      await tx.resumeVersion.updateMany({
        where: {
          projectId: acceptProposalDto.projectId,
          status: 'ACTIVE',
        },
        data: {
          status: 'DRAFT',
        },
      });

      // Step 2: Create new AI_GENERATED version with ACTIVE status
      const version = await tx.resumeVersion.create({
        data: {
          projectId: acceptProposalDto.projectId,
          parentVersionId: aiJob.baseVersionId,
          type: 'AI_GENERATED',
          status: 'ACTIVE', // New version is now ACTIVE
          latexContent: finalLatexContent,
        },
      });

      // Step 3: Delete the proposal (cleanup)
      await tx.proposedVersion.delete({
        where: { id: aiJob.proposedVersion.id },
      });

      return version;
    });

    return {
      newVersionId: newVersion.id,
    };
  }

  /**
   * Reject AI proposal and discard
   * PHASE 6: Proposal rejection
   * 
   * Deletes ProposedVersion
   * Resume remains unchanged
   */
  async rejectProposal(
    rejectProposalDto: { aiJobId: string },
    userId: string,
  ): Promise<{ success: boolean }> {
    // Fetch AI job with ownership verification
    const aiJob = await this.prisma.aIJob.findFirst({
      where: {
        id: rejectProposalDto.aiJobId,
        project: { userId },
      },
      include: {
        proposedVersion: true,
      },
    });

    if (!aiJob) {
      throw new NotFoundException('AI job not found or access denied');
    }

    if (!aiJob.proposedVersion) {
      throw new NotFoundException('No proposal found for this job');
    }

    // Delete the proposal
    await this.prisma.proposedVersion.delete({
      where: { id: aiJob.proposedVersion.id },
    });

    return {
      success: true,
    };
  }

  /**
   * GOAL 6: Chat-driven iteration
   * Refine existing proposal based on user feedback
   * 
   * Workflow:
   * 1. Fetch current proposal
   * 2. Create new AI job with feedback context
   * 3. Include chat history in AI prompt
   * 4. Generate refined proposal
   * 
   * Returns new jobId for polling
   */
  async refineProposal(
    aiJobId: string,
    feedback: string,
    userId: string,
  ): Promise<{ jobId: string }> {
    // Fetch original AI job with proposal
    const originalJob = await this.prisma.aIJob.findFirst({
      where: {
        id: aiJobId,
        project: { userId },
      },
      include: {
        proposedVersion: true,
        baseVersion: true,
        jd: true,
      },
    });

    if (!originalJob) {
      throw new NotFoundException('AI job not found or access denied');
    }

    if (!originalJob.proposedVersion) {
      throw new NotFoundException('No proposal found for this job');
    }

    if (originalJob.status !== 'COMPLETED') {
      throw new Error('Cannot refine incomplete proposal');
    }

    // Create new AI job for refinement
    const newJob = await this.prisma.aIJob.create({
      data: {
        projectId: originalJob.projectId,
        baseVersionId: originalJob.baseVersionId,
        jdId: originalJob.jdId,
        mode: originalJob.mode,
        status: 'QUEUED',
      },
    });

    // Start async processing with chat context
    // TODO: GOAL 6 - Store feedback in AIJob for auditability
    // For now, we reuse existing processing but with modified prompt
    this.executeAiJob(newJob.id)
      .catch((error) => {
        console.error(`AI job ${newJob.id} failed:`, error);
        this.prisma.aIJob
          .update({
            where: { id: newJob.id },
            data: {
              status: 'FAILED',
              errorMessage: error.message || 'Unknown error during refinement',
            },
          })
          .catch((updateError) => {
            console.error(`Failed to update job ${newJob.id} status:`, updateError);
          });
      });

    return { jobId: newJob.id };
  }

  /**
   * Get proposal content for completed AI job
   * PHASE 6: Proposal retrieval
   * GOAL 3: Return section-level proposals
   * 
   * Returns:
   * - proposedLatexContent (full assembled LaTeX)
   * - sectionProposals (array of per-section diffs)
   */
  async getProposal(
    jobId: string,
    userId: string,
  ): Promise<{ proposedLatexContent: string; sectionProposals: SectionProposal[] }> {
    // Fetch AI job with ownership verification
    const aiJob = await this.prisma.aIJob.findFirst({
      where: {
        id: jobId,
        project: { userId },
      },
      include: {
        proposedVersion: true,
      },
    });

    if (!aiJob) {
      throw new NotFoundException('AI job not found or access denied');
    }

    if (!aiJob.proposedVersion) {
      throw new NotFoundException('No proposal found for this job');
    }

    if (aiJob.status !== 'COMPLETED') {
      throw new BadRequestException('Job is not completed yet');
    }

    // GOAL 3: Return both full LaTeX and section proposals
    return {
      proposedLatexContent: aiJob.proposedVersion.proposedLatexContent,
      sectionProposals: aiJob.proposedVersion.sectionProposals as unknown as SectionProposal[],
    };
  }


  /**
   * List all AI jobs for a project
   * From apis.md Section 6.3
   * 
   * Returns all AI tailoring jobs for the project
   */
  async listJobsForProject(
    projectId: string,
    userId: string,
  ): Promise<AiJobListItemDto[]> {
    // Verify project ownership
    const project = await this.prisma.resumeProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Fetch all AI jobs for the project
    const aiJobs = await this.prisma.aIJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return aiJobs.map((job) => ({
      jobId: job.id,
      projectId: job.projectId,
      jdId: job.jdId,
      baseVersionId: job.baseVersionId,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    }));
  }

  /**
   * Chat endpoint for conversational AI assistance
   * 
   * Provides resume advice without modifying content.
   * Stateless - conversation history managed by frontend.
   * 
   * SAFETY: This NEVER modifies resume versions.
   * It's informational only - advice, suggestions, brainstorming.
   */
  async chat(chatDto: SendChatDto, userId: string): Promise<ChatResponseDto> {
    const { projectId, message, resumeContext, jdContext, conversationHistory } = chatDto;

    // Verify user owns the project
    const project = await this.prisma.resumeProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    try {
      // Build system prompt
      const systemPrompt = `You are an expert resume consultant providing friendly, conversational advice.

Your role:
- Answer questions about resume optimization in a natural, conversational way
- Suggest improvements and best practices
- Help brainstorm ways to present experience
- Explain resume gaps and how to address them
- Provide job-specific tailoring advice

IMPORTANT CONSTRAINTS:
- You are in CHAT MODE - you provide ADVICE only
- You CANNOT and WILL NOT modify the resume directly
- If user wants changes, explain what they could do
- Suggest specific phrases or approaches, but don't apply them
- You can show code examples, but they won't auto-apply

TONE & FORMATTING:
- Be conversational and friendly, like you're chatting with a colleague
- Use simple markdown: **bold**, *italic*, bullet lists, numbered lists
- AVOID tables - they don't render well in chat
- Use bullet points instead of tables for comparisons
- Keep responses concise and scannable
- Use emojis sparingly (1-2 per response max)
- Break up long responses with clear headings

Be helpful, specific, and actionable. Use examples when helpful.`;

      // Build conversation context
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })));
      }

      // Build context-aware user message
      let contextualMessage = message;
      
      if (resumeContext || jdContext) {
        let contextPrefix = '';
        
        if (resumeContext) {
          contextPrefix += `\n\nCurrent Resume Context:\n\`\`\`latex\n${resumeContext.substring(0, 2000)}\n\`\`\`\n`;
        }
        
        if (jdContext) {
          contextPrefix += `\n\nJob Description Context:\n\`\`\`\n${jdContext.substring(0, 1000)}\n\`\`\`\n`;
        }
        
        contextualMessage = `${contextPrefix}\n\nUser Question: ${message}`;
      }

      messages.push({
        role: 'user',
        content: contextualMessage,
      });

      // Call AI
      const response = await this.aiClient.chat.completions.create({
        model: 'deepseek-ai/DeepSeek-V3-0324-fast',
        messages,
        temperature: 0.7,
        max_tokens: 2048, // Increased to allow reasoning models to complete
      });

      // Check both content and reasoning_content (some models use reasoning mode)
      const messageObj = response.choices[0]?.message;
      const assistantMessage = messageObj?.content || (messageObj as any)?.reasoning_content;
      
      if (!assistantMessage) {
        console.error('No message content in AI response. Full response:', response);
        throw new Error('AI did not return a valid response');
      }

      return {
        message: assistantMessage,
      };
    } catch (error) {
      console.error('Chat error details:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('API key')) {
        throw new BadRequestException('AI service authentication failed');
      }
      
      if (error.message?.includes('rate limit')) {
        throw new BadRequestException('AI service rate limit exceeded. Please try again in a moment.');
      }
      
      if (error.message?.includes('timeout')) {
        throw new BadRequestException('AI service timeout. Please try again.');
      }
      
      throw new BadRequestException(
        error.message || 'Failed to process chat request. Please try again.'
      );
    }
  }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartAiTailoringDto, StartAiTailoringResponseDto, AiJobStatusDto, AiJobListItemDto } from './dto/ai-job.dto';
import OpenAI from 'openai';

/**
 * AI Jobs Service
 * 
 * PHASE 5: AI JOB INFRASTRUCTURE (NO REWRITING)
 * - Real database operations
 * - Ownership enforcement
 * - NO AI execution (placeholder only)
 * 
 * From apis.md Section 6
 */
@Injectable()
export class AiJobsService {
  private readonly aiClient: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    // Initialize Nebius AI client
    this.aiClient = new OpenAI({
      baseURL: 'https://api.tokenfactory.nebius.com/v1/',
      apiKey: process.env.NEBIUS_API_KEY,
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
    const { projectId, baseVersionId, jdId, mode } = startTailoringDto;

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

    // Verify JD exists and belongs to the project
    const jd = await this.prisma.jobDescription.findUnique({
      where: { id: jdId },
    });

    if (!jd) {
      throw new NotFoundException(`Job description ${jdId} not found`);
    }

    if (jd.projectId !== projectId) {
      throw new ForbiddenException('Job description does not belong to this project');
    }

    // Create AIJob with status=QUEUED
    const aiJob = await this.prisma.aIJob.create({
      data: {
        projectId,
        baseVersionId,
        jdId,
        mode,
        status: 'QUEUED',
        errorMessage: null,
      },
    });

    // PHASE 6: Execute AI job immediately (synchronous for now)
    // TODO: Move to background queue in future phase
    await this.executeAiJob(aiJob.id);

    return {
      jobId: aiJob.id,
    };
  }

  /**
   * Execute AI job and generate proposed resume
   * PHASE 6: AI RESUME TAILORING (PROPOSAL ONLY)
   * 
   * Process:
   * 1. Load base ResumeVersion (latexContent)
   * 2. Load JD (rawText)
   * 3. Call AI to generate proposal
   * 4. Store in ProposedVersion table
   * 5. Update AIJob status to COMPLETED
   * 
   * Forbidden:
   * - No ResumeVersion creation
   * - No editor mutation
   * - No overwrite of base version
   */
  private async executeAiJob(jobId: string): Promise<void> {
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

      // Input: base resume latexContent + JD rawText
      const baseLatexContent = aiJob.baseVersion.latexContent;
      const jdRawText = aiJob.jd.rawText;

      // TODO: Call actual AI service to generate tailored resume
      // For now, use placeholder logic
      const proposedLatexContent = await this.generateProposedResume(
        baseLatexContent,
        jdRawText,
        aiJob.mode,
      );

      // Store proposal in ProposedVersion table
      await this.prisma.proposedVersion.upsert({
        where: { aiJobId: jobId },
        create: {
          aiJobId: jobId,
          proposedLatexContent,
        },
        update: {
          proposedLatexContent,
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
        model: 'openai/gpt-oss-20b',
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
   * 
   * Creates new AI_GENERATED ResumeVersion from ProposedVersion
   * Sets parentVersionId to baseVersionId
   * Returns new versionId
   * 
   * Forbidden:
   * - No partial acceptance
   * - No silent apply
   */
  async acceptProposal(
    acceptProposalDto: { aiJobId: string; projectId: string },
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

    // Create new AI_GENERATED version
    const newVersion = await this.prisma.resumeVersion.create({
      data: {
        projectId: acceptProposalDto.projectId,
        parentVersionId: aiJob.baseVersionId,
        type: 'AI_GENERATED',
        status: 'DRAFT',
        latexContent: aiJob.proposedVersion.proposedLatexContent,
      },
    });

    // Delete the proposal (cleanup)
    await this.prisma.proposedVersion.delete({
      where: { id: aiJob.proposedVersion.id },
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
   * Get proposal content for completed AI job
   * PHASE 6: Proposal retrieval
   * 
   * Returns proposedLatexContent from ProposedVersion
   */
  async getProposal(
    jobId: string,
    userId: string,
  ): Promise<{ proposedLatexContent: string }> {
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

    return {
      proposedLatexContent: aiJob.proposedVersion.proposedLatexContent,
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
}

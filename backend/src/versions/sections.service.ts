import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SectionDto, CreateSectionDto, UpdateSectionDto, SectionType } from './dto/section.dto';
import { ResumeSection, ResumeSectionType } from '@prisma/client';
import { LatexParserService } from './latex-parser.service';

/**
 * Sections Service
 * 
 * GOAL 1: Resume Section Model (Backend)
 * GOAL 2: Section Extraction & Assembly
 * 
 * Purpose:
 * - Manage sections within ResumeVersions
 * - Enforce immutability (sections belong to versions)
 * - Support locked/unlocked state
 * - Enable section-level AI diffs
 * - Extract sections from LaTeX documents
 * - Assemble sections back into valid LaTeX
 * 
 * Design:
 * - Sections are IMMUTABLE once version is finalized
 * - Creating new version = copying sections from parent
 * - Locked sections prevent AI modification
 * - Each version has independent section snapshots
 * 
 * Integration with ResumeVersion:
 * - When version V2 created from V1:
 *   1. Copy all sections from V1
 *   2. Preserve isLocked state
 *   3. Allow modifications only to unlocked sections
 *   4. Store modified sections in V2
 * - V1 sections remain unchanged (immutability preserved)
 * 
 * Legacy Version Handling:
 * - Lazy extraction: sections extracted on-demand (AI job trigger)
 * - Never auto-extract on read operations
 * - extractAndStoreSections() called explicitly when needed
 */
@Injectable()
export class SectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly latexParser: LatexParserService,
  ) {}

  /**
   * Get all sections for a version
   * Ordered by orderIndex
   */
  async getSectionsForVersion(versionId: string, userId: string): Promise<SectionDto[]> {
    // Verify ownership
    await this.verifyVersionOwnership(versionId, userId);

    const sections = await this.prisma.resumeSection.findMany({
      where: { versionId },
      orderBy: { orderIndex: 'asc' },
    });

    return sections.map(this.toDto);
  }

  /**
   * Get single section by ID
   */
  async getSection(sectionId: string, userId: string): Promise<SectionDto> {
    const section = await this.prisma.resumeSection.findUnique({
      where: { id: sectionId },
      include: { version: { include: { project: true } } },
    });

    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    // Verify ownership via version → project
    if (section.version.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this section');
    }

    return this.toDto(section);
  }

  /**
   * Create sections for a new version
   * Called internally when creating versions
   */
  async createSectionsForVersion(
    versionId: string,
    sections: CreateSectionDto[],
  ): Promise<void> {
    // Validate unique section types
    const types = sections.map(s => s.sectionType);
    const uniqueTypes = new Set(types);
    if (types.length !== uniqueTypes.size) {
      throw new BadRequestException('Duplicate section types not allowed per version');
    }

    // Create all sections in transaction
    await this.prisma.$transaction(
      sections.map(section =>
        this.prisma.resumeSection.create({
          data: {
            versionId,
            sectionType: section.sectionType as ResumeSectionType,
            content: section.content,
            isLocked: section.isLocked,
            orderIndex: section.orderIndex,
          },
        }),
      ),
    );
  }

  /**
   * Copy sections from parent version to new version
   * 
   * CRITICAL for version immutability:
   * - Locked sections copied as-is
   * - Unlocked sections can be modified (passed via modifications param)
   * - Parent sections remain unchanged
   * 
   * LEGACY VERSION HANDLING:
   * - If parent has no sections, extracts them first (lazy extraction)
   * - This is the ONLY auto-extraction point
   * - Ensures new versions always have sections
   * 
   * @param parentVersionId - Source version
   * @param newVersionId - Target version
   * @param modifications - Optional changes to unlocked sections (sectionType → new content)
   */
  async copySectionsFromParent(
    parentVersionId: string,
    newVersionId: string,
    modifications?: Map<SectionType, string>,
  ): Promise<void> {
    // Check if parent has sections
    let parentSections = await this.prisma.resumeSection.findMany({
      where: { versionId: parentVersionId },
      orderBy: { orderIndex: 'asc' },
    });

    // LAZY EXTRACTION: If parent has no sections, extract them now
    if (parentSections.length === 0) {
      await this.extractAndStoreSections(parentVersionId);
      
      // Re-fetch after extraction
      parentSections = await this.prisma.resumeSection.findMany({
        where: { versionId: parentVersionId },
        orderBy: { orderIndex: 'asc' },
      });
    }

    if (parentSections.length === 0) {
      // Still no sections after extraction (edge case: empty document)
      return;
    }

    // Create new sections in new version
    await this.prisma.$transaction(
      parentSections.map(parentSection => {
        const sectionType = parentSection.sectionType as unknown as SectionType;
        
        // LOCK ENFORCEMENT: Use modified content ONLY if unlocked
        const content =
          !parentSection.isLocked && modifications?.has(sectionType)
            ? modifications.get(sectionType)!
            : parentSection.content;

        return this.prisma.resumeSection.create({
          data: {
            versionId: newVersionId,
            sectionType: parentSection.sectionType,
            content,
            isLocked: parentSection.isLocked, // Preserve lock state
            orderIndex: parentSection.orderIndex,
          },
        });
      }),
    );
  }

  /**
   * Update section lock state
   * Allowed only for DRAFT versions
   */
  async updateSectionLock(
    sectionId: string,
    isLocked: boolean,
    userId: string,
  ): Promise<SectionDto> {
    const section = await this.prisma.resumeSection.findUnique({
      where: { id: sectionId },
      include: { version: { include: { project: true } } },
    });

    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    // Verify ownership
    if (section.version.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this section');
    }

    // Only allow lock changes on DRAFT versions
    if (section.version.status !== 'DRAFT' && section.version.status !== 'ACTIVE') {
      throw new BadRequestException('Can only modify section locks on DRAFT/ACTIVE versions');
    }

    const updated = await this.prisma.resumeSection.update({
      where: { id: sectionId },
      data: { isLocked },
    });

    return this.toDto(updated);
  }

  /**
   * Get unlocked sections for AI processing
   * Returns only sections that AI is allowed to modify
   */
  async getUnlockedSections(versionId: string): Promise<SectionDto[]> {
    const sections = await this.prisma.resumeSection.findMany({
      where: {
        versionId,
        isLocked: false,
      },
      orderBy: { orderIndex: 'asc' },
    });

    return sections.map(this.toDto);
  }

  /**
   * Verify user owns version (via project)
   */
  private async verifyVersionOwnership(versionId: string, userId: string): Promise<void> {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: { project: true },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    if (version.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this version');
    }
  }

  /**
   * Convert Prisma model to DTO
   */
  private toDto(section: ResumeSection): SectionDto {
    return {
      id: section.id,
      versionId: section.versionId,
      sectionType: section.sectionType as unknown as SectionType,
      content: section.content,
      isLocked: section.isLocked,
      orderIndex: section.orderIndex,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
    };
  }

  // ============================================
  // GOAL 2: Section Extraction & Assembly
  // ============================================

  /**
   * Extract and store sections from a version's LaTeX content
   * 
   * LAZY EXTRACTION STRATEGY:
   * - Called explicitly when:
   *   1. AI job started on legacy version (no sections)
   *   2. Version used as parent for new version
   * - NEVER called on simple read operations
   * - NEVER auto-migrates on GET requests
   * 
   * Process:
   * 1. Check if version already has sections
   * 2. If yes, return existing sections
   * 3. If no, extract from latexContent
   * 4. Store extracted sections in DB
   * 5. Return sections
   * 
   * Idempotent: Safe to call multiple times
   */
  async extractAndStoreSections(versionId: string): Promise<SectionDto[]> {
    // Step 1: Check if sections already exist
    const existingSections = await this.prisma.resumeSection.findMany({
      where: { versionId },
    });

    if (existingSections.length > 0) {
      // Already extracted, return existing
      return existingSections.map(this.toDto);
    }

    // Step 2: Load version to get latexContent
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Step 3: Extract sections using parser
    const parsed = this.latexParser.extractSections(version.latexContent);

    // Step 4: Store sections in DB
    const sectionsToCreate = parsed.sections.map(section => ({
      versionId,
      sectionType: section.sectionType as ResumeSectionType,
      content: section.content,
      isLocked: section.isLocked,
      orderIndex: section.orderIndex,
    }));

    await this.prisma.$transaction(
      sectionsToCreate.map(data =>
        this.prisma.resumeSection.create({ data }),
      ),
    );

    // Step 5: Return created sections
    const createdSections = await this.prisma.resumeSection.findMany({
      where: { versionId },
      orderBy: { orderIndex: 'asc' },
    });

    return createdSections.map(this.toDto);
  }

  /**
   * Assemble sections into complete LaTeX document
   * 
   * Use case: Generate final LaTeX from modified sections
   * 
   * Process:
   * 1. Load all sections for version (ordered)
   * 2. Parse original latexContent to get preamble/postamble
   * 3. Assemble with sections
   * 
   * Guarantees:
   * - Preamble preserved exactly
   * - Section order respected
   * - Postamble preserved exactly
   * - Markers added for traceability
   */
  async assembleLatexFromSections(versionId: string): Promise<string> {
    // Load version for preamble/postamble
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Load sections
    const sections = await this.prisma.resumeSection.findMany({
      where: { versionId },
      orderBy: { orderIndex: 'asc' },
    });

    if (sections.length === 0) {
      // No sections - return original latexContent
      return version.latexContent;
    }

    // Parse original to get structure
    const originalParsed = this.latexParser.extractSections(version.latexContent);

    // Build new parsed document with current sections
    const newParsed = {
      preamble: originalParsed.preamble,
      postamble: originalParsed.postamble,
      sections: sections.map(s => ({
        sectionType: s.sectionType as unknown as SectionType,
        content: s.content,
        orderIndex: s.orderIndex,
        isLocked: s.isLocked,
      })),
    };

    // Assemble
    return this.latexParser.assembleSections(newParsed);
  }

  /**
   * Check if version has sections
   * Used to determine if extraction is needed
   */
  async hasSections(versionId: string): Promise<boolean> {
    const count = await this.prisma.resumeSection.count({
      where: { versionId },
    });
    return count > 0;
  }
}


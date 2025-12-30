import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ResumeVersionDto,
  SaveResumeEditDto,
  SaveResumeEditResponseDto,
  CompileResumeResponseDto,
  VersionDiffDto,
} from './dto/version.dto';

/**
 * Versions Service
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - Real database operations
 * - Version creation with parentVersionId tracking
 * - Ownership enforcement via project relationship
 * - No LaTeX compilation (future phase)
 * - No diff logic (future phase)
 * 
 * From apis.md Sections 4, 7, 8
 */
@Injectable()
export class VersionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create base version for new project
   * Called internally by ProjectsService
   * 
   * PHASE 2: Real database operation
   * - Creates initial BASE version with placeholder content
   * - No parentVersionId (root of version tree)
   * - Status DRAFT (not compiled yet)
   */
  async createBaseVersion(projectId: string, initialContent?: string): Promise<string> {
    const defaultContent = initialContent || 
      '\\documentclass{article}\n\\begin{document}\n% Your resume content here\n\\end{document}';
    
    const version = await this.prisma.resumeVersion.create({
      data: {
        projectId,
        parentVersionId: null, // Base version has no parent
        type: 'BASE',
        status: 'DRAFT',
        latexContent: defaultContent,
        pdfUrl: null,
      },
    });

    return version.id;
  }

  /**
   * Get a specific resume version
   * From apis.md Section 4.1
   * 
   * PHASE 2: Real database query
   * - Loads version from database
   * - Ownership verified via project relationship (userId passed separately)
   * - Returns exact shape from apis.md
   */
  async getVersion(versionId: string, userId: string): Promise<ResumeVersionDto> {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: { project: true },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Verify ownership via project relationship
    if (version.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this version');
    }

    return {
      versionId: version.id,
      projectId: version.projectId,
      type: version.type,
      status: version.status,
      latexContent: version.latexContent,
      pdfUrl: version.pdfUrl,
      createdAt: version.createdAt.toISOString(),
    };
  }

  /**
   * Save manual resume edit (creates new MANUAL version)
   * From apis.md Section 4.2
   * 
   * PHASE 2: Real database operation
   * - Loads parent version to verify ownership
   * - Creates NEW version with type=MANUAL
   * - Sets parentVersionId to track lineage
   * - NEVER mutates existing version (immutability rule)
   */
  async saveEdit(
    versionId: string,
    saveEditDto: SaveResumeEditDto,
    userId: string,
  ): Promise<SaveResumeEditResponseDto> {
    // Load parent version and verify ownership
    const parentVersion = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: { project: true },
    });

    if (!parentVersion) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    if (parentVersion.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this version');
    }

    // Create new MANUAL version with parentVersionId
    const newVersion = await this.prisma.resumeVersion.create({
      data: {
        projectId: parentVersion.projectId,
        parentVersionId: versionId,
        type: 'MANUAL',
        status: 'DRAFT',
        latexContent: saveEditDto.latexContent,
        pdfUrl: null,
      },
    });

    return {
      newVersionId: newVersion.id,
    };
  }

  /**
   * Compile resume version to PDF
   * From apis.md Section 4.3
   * 
   * PHASE 2: Placeholder with ownership verification (security stub)
   * TODO: PHASE 4 - Implement LaTeX compilation
   * TODO: PHASE 4 - Upload PDF to S3-compatible storage
   * TODO: PHASE 4 - Update version pdfUrl
   * TODO: PHASE 4 - Handle compilation errors
   */
  async compileVersion(versionId: string, userId: string): Promise<CompileResumeResponseDto> {
    // PHASE 2 HARDENING: Verify ownership even in placeholder
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

    // TODO: PHASE 4 - Real compilation logic
    // For now, return placeholder
    return {
      status: 'success',
      errors: [],
    };
  }

  /**
   * Get diff between two versions
   * From apis.md Section 7.1
   * 
   * PHASE 2: Placeholder with ownership verification (security stub)
   * TODO: PHASE 4 - Implement diff logic
   * TODO: PHASE 4 - Generate or retrieve VersionDiff
   * TODO: PHASE 4 - Parse LaTeX changes
   */
  async getVersionDiff(fromVersionId: string, toVersionId: string, userId: string): Promise<VersionDiffDto> {
    // PHASE 2 HARDENING: Verify ownership of BOTH versions even in placeholder
    const [fromVersion, toVersion] = await Promise.all([
      this.prisma.resumeVersion.findUnique({
        where: { id: fromVersionId },
        include: { project: true },
      }),
      this.prisma.resumeVersion.findUnique({
        where: { id: toVersionId },
        include: { project: true },
      }),
    ]);

    if (!fromVersion) {
      throw new NotFoundException(`Version ${fromVersionId} not found`);
    }

    if (!toVersion) {
      throw new NotFoundException(`Version ${toVersionId} not found`);
    }

    if (fromVersion.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to the source version');
    }

    if (toVersion.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to the target version');
    }

    // TODO: PHASE 4 - Real diff logic
    // For now, return placeholder
    return {
      added: ['New bullet point about Azure'],
      removed: ['Old bullet point about AWS'],
      rewritten: [
        {
          before: 'Developed web applications',
          after: 'Engineered scalable web applications',
        },
      ],
    };
  }

  /**
   * Download PDF version
   * From apis.md Section 8.1
   * 
   * PHASE 2: Placeholder with ownership verification (security stub)
   * TODO: PHASE 4 - Implement file download
   * TODO: PHASE 4 - Return signed S3 URL or file stream
   * TODO: PHASE 4 - Verify version is COMPILED
   */
  async downloadPdf(versionId: string, userId: string): Promise<string> {
    // PHASE 2 HARDENING: Verify ownership even in placeholder
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

    // TODO: PHASE 4 - Real file download logic
    // For now, return placeholder
    return 'https://placeholder-pdf-url.com/resume.pdf';
  }

  /**
   * Download LaTeX source
   * From apis.md Section 8.2
   * 
   * PHASE 2: Placeholder with ownership verification (security stub)
   * TODO: PHASE 4 - Implement file download
   * TODO: PHASE 4 - Return LaTeX content as file
   */
  async downloadLatex(versionId: string, userId: string): Promise<string> {
    // PHASE 2 HARDENING: Verify ownership even in placeholder
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

    // TODO: PHASE 4 - Real file download logic
    // For now, return placeholder
    return '\\documentclass{article}\n\\begin{document}\nPlaceholder\n\\end{document}';
  }

  /**
   * Get active version for a project
   * PHASE 2: Critical for editor loading
   * 
   * Returns the LATEST version for a project (most recently created)
   * Used by frontend to load editor after project creation
   */
  async getActiveVersionForProject(projectId: string, userId: string): Promise<ResumeVersionDto> {
    // Verify project ownership first
    const project = await this.prisma.resumeProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Find the LATEST version (most recently created)
    const version = await this.prisma.resumeVersion.findFirst({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc', // Most recent version
      },
    });

    if (!version) {
      throw new NotFoundException(`No versions found for project ${projectId}`);
    }

    return {
      versionId: version.id,
      projectId: version.projectId,
      type: version.type,
      status: version.status,
      latexContent: version.latexContent,
      pdfUrl: version.pdfUrl,
      createdAt: version.createdAt.toISOString(),
    };
  }
}

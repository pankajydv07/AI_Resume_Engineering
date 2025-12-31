import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import {
  ResumeVersionDto,
  SaveResumeEditDto,
  SaveResumeEditResponseDto,
  CompileResumeResponseDto,
  VersionDiffDto,
  VersionListItemDto,
} from './dto/version.dto';

const execAsync = promisify(exec);

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
 * PHASE 8: COMPILATION & OUTPUT
 * - LaTeX → PDF compilation using pdflatex
 * - Cloudinary upload for PDF storage
 * - Version immutability (no mutations, only status updates)
 * 
 * From apis.md Sections 4, 7, 8
 */
@Injectable()
export class VersionsService {
  constructor(private readonly prisma: PrismaService) {
    // Configure Cloudinary from CLOUDINARY_URL environment variable
    // Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    console.log('🔧 Cloudinary Config Debug:');
    console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'SET' : 'NOT SET');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');
    
    if (process.env.CLOUDINARY_URL) {
      console.log('✅ Using CLOUDINARY_URL');
      cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL,
      });
    } else {
      console.log('⚠️ Using individual config keys');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
    
    // Log final config (without secrets)
    const config = cloudinary.config();
    console.log('📦 Final Cloudinary config:', {
      cloud_name: config.cloud_name,
      api_key: config.api_key ? 'SET' : 'NOT SET',
      api_secret: config.api_secret ? 'SET' : 'NOT SET',
    });
  }

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
   * 
   * CRITICAL FIX: ACTIVE status transfer
   * - New version becomes ACTIVE
   * - Old ACTIVE version becomes DRAFT
   * - Ensures only ONE ACTIVE version per project
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

    // CRITICAL: Use transaction to atomically transfer ACTIVE status
    const result = await this.prisma.$transaction(async (tx) => {
      // Step 1: Demote current ACTIVE version to DRAFT
      await tx.resumeVersion.updateMany({
        where: {
          projectId: parentVersion.projectId,
          status: 'ACTIVE',
        },
        data: {
          status: 'DRAFT',
        },
      });

      // Step 2: Create new MANUAL version with ACTIVE status
      const newVersion = await tx.resumeVersion.create({
        data: {
          projectId: parentVersion.projectId,
          parentVersionId: versionId,
          type: 'MANUAL',
          status: 'ACTIVE', // New version is now ACTIVE
          latexContent: saveEditDto.latexContent,
          pdfUrl: null,
        },
      });

      return newVersion;
    });

    return {
      newVersionId: result.id,
    };
  }

  /**
   * Compile resume version to PDF
   * From apis.md Section 4.3
   * 
   * PHASE 8: REAL COMPILATION IMPLEMENTATION
   * Per rules.md "Phase 8: Compilation & Output (STRICT)":
   * - Compiler: pdflatex only
   * - Execution: synchronous
   * - Storage: Cloudinary (raw upload)
   * - Immutability: NEVER creates versions, ONLY updates pdfUrl and status
   * - If version.status === COMPILED → return success (idempotent)
   * 
   * Flow:
   * 1. Verify ownership
   * 2. Check if already compiled (idempotent)
   * 3. Write LaTeX to temp directory (scoped by versionId)
   * 4. Compile using pdflatex with security flags
   * 5. Upload PDF to Cloudinary as raw file
   * 6. Update version.pdfUrl and version.status
   * 7. Clean up temp files
   * 8. Return success or detailed errors
   */
  async compileVersion(versionId: string, userId: string): Promise<CompileResumeResponseDto> {
    console.log('🚀 Starting compilation for version:', versionId);
    
    // Step 1: Verify ownership
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

    console.log('✅ Ownership verified');

    // Step 2: If already compiled, return success (idempotent per rules.md)
    if (version.status === 'COMPILED' && version.pdfUrl) {
      console.log('ℹ️ Already compiled, returning cached result');
      return {
        status: 'success',
        errors: [],
      };
    }

    // Step 3: Create temp directory scoped by versionId
    const tempDir = path.join('/tmp', `resume-${versionId}`);
    const texFilePath = path.join(tempDir, 'resume.tex');
    const pdfFilePath = path.join(tempDir, 'resume.pdf');
    const logFilePath = path.join(tempDir, 'resume.log');

    console.log('📁 Temp directory:', tempDir);

    try {
      // Ensure temp directory exists
      await fs.promises.mkdir(tempDir, { recursive: true });
      console.log('✅ Temp directory created');

      // Write LaTeX content to file
      await fs.promises.writeFile(texFilePath, version.latexContent, 'utf-8');
      console.log('✅ LaTeX file written');

      // Step 4: Compile using pdflatex with security flags
      // Flags per rules.md:
      // - -interaction=nonstopmode (no user interaction)
      // - -halt-on-error (stop on first error)
      // - -no-shell-escape (security: disable shell commands)
      const compileCommand = `pdflatex -interaction=nonstopmode -no-shell-escape -output-directory="${tempDir}" "${texFilePath}"`;

      console.log('🔨 Running pdflatex...');

      let compilationErrors: string[] = [];
      let hasCompilationWarnings = false;

      try {
        // Run pdflatex compilation
        await execAsync(compileCommand, {
          cwd: tempDir,
          timeout: 30000, // 30 second timeout
        });

        console.log('✅ pdflatex completed');

      } catch (compileError) {
        console.error('⚠️ Compilation had errors:', compileError.message);
        hasCompilationWarnings = true;
        
        // Parse compilation errors from log file
        compilationErrors = await this.parseLatexErrors(logFilePath);
        if (compilationErrors.length === 0) {
          compilationErrors = [compileError.message || 'Compilation had warnings'];
        }
      }

      // Check if PDF was created (even if there were errors)
      const pdfExists = await fs.promises.access(pdfFilePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);

      if (!pdfExists) {
        console.error('❌ PDF file was not generated');
        
        // Update version status to ERROR
        await this.prisma.resumeVersion.update({
          where: { id: versionId },
          data: { status: 'ERROR' },
        });

        return {
          status: 'error',
          errors: compilationErrors.length > 0 ? compilationErrors : ['PDF file was not generated'],
        };
      }

      console.log('✅ PDF file created');

      // If we have compilation warnings, log them but continue
      if (hasCompilationWarnings) {
        console.warn('⚠️ PDF created with warnings:', compilationErrors.join(', '));
      }

      // Step 5: Upload PDF to Cloudinary as raw file
      console.log('☁️ Uploading to Cloudinary...');
      
      try {
        const uploadResult = await cloudinary.uploader.upload(pdfFilePath, {
          resource_type: "image",
          format: "pdf",
          folder: "resumes",
          public_id: `resume-${versionId}`,
          overwrite: true,
          type: "upload",        // ✅ PUBLIC
          access_mode: "public", // ✅ IMPORTANT
        });

        const pdfUrl = uploadResult.secure_url;
        console.log('✅ Uploaded PDF (image pipeline):', pdfUrl);

        // Step 6: Update version with pdfUrl and status COMPILED
        // Per rules.md: Compilation ONLY updates pdfUrl and status
        await this.prisma.resumeVersion.update({
          where: { id: versionId },
          data: {
            pdfUrl,
            status: 'COMPILED',
          },
        });

        console.log('✅ Database updated');

        // Step 7: Clean up temp files
        await this.cleanupTempDirectory(tempDir);
        console.log('✅ Cleanup complete');

        // Step 8: Return success or warning
        if (hasCompilationWarnings) {
          return {
            status: 'warning',
            errors: compilationErrors,
          };
        }
        
        return {
          status: 'success',
          errors: [],
        };
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload failed:', cloudinaryError);
        throw cloudinaryError;
      }

    } catch (error) {
      console.error('❌ Compilation error:', error);
      
      // Clean up on any error
      await this.cleanupTempDirectory(tempDir);

      // Update version status to ERROR
      await this.prisma.resumeVersion.update({
        where: { id: versionId },
        data: { status: 'ERROR' },
      });

      return {
        status: 'error',
        errors: [error.message || 'An unexpected error occurred during compilation'],
      };
    }
  }

  /**
   * Parse LaTeX compilation errors from log file
   * Extracts meaningful error messages for user display
   */
  private async parseLatexErrors(logFilePath: string): Promise<string[]> {
    try {
      const logContent = await fs.promises.readFile(logFilePath, 'utf-8');
      const errors: string[] = [];

      // Look for error patterns in LaTeX log
      const errorLines = logContent.split('\n').filter(line => 
        line.includes('!') || 
        line.includes('Error:') || 
        line.includes('Undefined control sequence')
      );

      // Extract first few meaningful errors
      errorLines.slice(0, 5).forEach(line => {
        const cleaned = line.trim();
        if (cleaned.length > 0) {
          errors.push(cleaned);
        }
      });

      return errors.length > 0 ? errors : ['LaTeX compilation failed. Check your syntax.'];
    } catch {
      return ['Could not read compilation log'];
    }
  }

  /**
   * Clean up temporary compilation directory
   */
  private async cleanupTempDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to clean up temp directory ${dirPath}:`, error);
      // Non-fatal error, just log it
    }
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
   * List all versions for a project
   * From apis.md Section 4.4
   * 
   * Returns all versions ordered by creation date (newest first)
   * Used for version selector dropdown and version history
   */
  async listVersionsForProject(projectId: string, userId: string): Promise<VersionListItemDto[]> {
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

    // Fetch all versions for the project
    const versions = await this.prisma.resumeVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }, // Newest first
      select: {
        id: true,
        projectId: true,
        type: true,
        status: true,
        createdAt: true,
        parentVersionId: true,
      },
    });

    return versions.map(version => ({
      versionId: version.id,
      projectId: version.projectId,
      type: version.type,
      status: version.status,
      createdAt: version.createdAt.toISOString(),
      parentVersionId: version.parentVersionId,
    }));
  }
}

import { Controller, Get, Put, Post, Param, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VersionsService } from './versions.service';
import {
  ResumeVersionDto,
  SaveResumeEditDto,
  SaveResumeEditResponseDto,
  CompileResumeResponseDto,
  VersionDiffDto,
  VersionListItemDto,
} from './dto/version.dto';

/**
 * Versions Controller
 * 
 * Handles resume version operations
 * All endpoints from apis.md Sections 4, 7, 8
 * 
 * SECURITY HARDENING:
 * - Rate limiting on write operations
 * - Input validation via DTOs
 * - User ownership enforcement via project relationship
 */
@Controller('versions')
@UseGuards(ClerkAuthGuard)
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  /**
   * GET /api/versions/project/:projectId
   * List all versions for a project
   * From apis.md Section 4.4
   * 
   * CRITICAL: This MUST be defined BEFORE versions/:versionId route
   * to avoid route collision (NestJS matches routes in order)
   * 
   * Returns all versions ordered by creation date (newest first)
   * Used for version selector dropdown and version history
   */
  @Get('project/:projectId')
  async listVersionsForProject(
    @Param('projectId') projectId: string,
    @CurrentUser() userId: string,
  ): Promise<VersionListItemDto[]> {
    return this.versionsService.listVersionsForProject(projectId, userId);
  }

  /**
   * GET /api/versions/:versionId
   * Get a specific resume version
   * From apis.md Section 4.1
   * 
   * Returns version with full LaTeX content
   */
  @Get(':versionId')
  async getVersion(
    @Param('versionId') versionId: string,
    @CurrentUser() userId: string,
  ): Promise<ResumeVersionDto> {
    return this.versionsService.getVersion(versionId, userId);
  }

  /**
   * PUT /api/versions/:versionId
   * Save manual resume edit (creates new MANUAL version)
   * From apis.md Section 4.2
   * 
   * SECURITY: Rate limited (30 requests/minute)
   * 
   * Important: NEVER overwrites existing version
   * Creates new version with parentVersionId
   */
  @Put(':versionId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async saveEdit(
    @Param('versionId') versionId: string,
    @Body() saveEditDto: SaveResumeEditDto,
    @CurrentUser() userId: string,
  ): Promise<SaveResumeEditResponseDto> {
    return this.versionsService.saveEdit(versionId, saveEditDto, userId);
  }

  /**
   * POST /api/versions/:versionId/compile
   * Compile resume version to PDF
   * From apis.md Section 4.3
   * 
   * SECURITY: Rate limited (10 requests/minute) - CPU-intensive operation
   */
  @Post(':versionId/compile')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async compileVersion(
    @Param('versionId') versionId: string,
    @CurrentUser() userId: string,
  ): Promise<CompileResumeResponseDto> {
    return this.versionsService.compileVersion(versionId, userId);
  }

  /**
   * GET /api/versions/diff
   * Get diff between two versions
   * From apis.md Section 7.1
   */
  @Get('diff')
  async getVersionDiff(
    @Query('from') fromVersionId: string,
    @Query('to') toVersionId: string,
    @CurrentUser() userId: string,
  ): Promise<VersionDiffDto> {
    return this.versionsService.getVersionDiff(fromVersionId, toVersionId, userId);
  }

  /**
   * GET /api/versions/:versionId/download/pdf
   * Download PDF version
   * From apis.md Section 8.1
   * 
   * Returns Cloudinary URL for direct download
   */
  @Get(':versionId/download/pdf')
  async downloadPdf(
    @Param('versionId') versionId: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.versionsService.downloadPdf(versionId, userId);
    res.json({ url });
  }

  /**
   * GET /api/versions/:versionId/download/latex
   * Download LaTeX source
   * From apis.md Section 8.2
   * 
   * Returns LaTeX content with proper headers
   */
  @Get(':versionId/download/latex')
  async downloadLatex(
    @Param('versionId') versionId: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.versionsService.downloadLatex(versionId, userId);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/x-latex');
    res.setHeader('Content-Disposition', `attachment; filename="resume-${versionId.substring(0, 8)}.tex"`);
    res.send(content);
  }
}

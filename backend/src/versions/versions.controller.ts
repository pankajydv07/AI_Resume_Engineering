import { Controller, Get, Put, Post, Param, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VersionsService } from './versions.service';
import {
  ResumeVersionDto,
  SaveResumeEditDto,
  SaveResumeEditResponseDto,
  CompileResumeResponseDto,
  VersionDiffDto,
} from './dto/version.dto';

/**
 * Versions Controller
 * 
 * Handles resume version operations
 * All endpoints from apis.md Sections 4, 7, 8
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - ClerkAuthGuard active (mock auth, real DB users)
 * - Ownership verified via project relationship
 * - Real database operations for get/save
 */
@Controller('versions')
@UseGuards(ClerkAuthGuard)
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  /**
   * GET /api/versions/:versionId
   * Get a specific resume version
   * From apis.md Section 4.1
   * 
   * PHASE 2: Real database query with ownership verification
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
   * Important: NEVER overwrites existing version
   * Creates new version with parentVersionId
   * 
   * PHASE 2: Real database operation, creates new version
   */
  @Put(':versionId')
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
   * PHASE 2: Placeholder only (compilation in PHASE 4)
   */
  @Post(':versionId/compile')
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
   * 
   * PHASE 2: Placeholder only (diff logic in PHASE 4)
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
   * PHASE 2: Placeholder only (file storage in PHASE 4)
   */
  @Get(':versionId/download/pdf')
  async downloadPdf(
    @Param('versionId') versionId: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.versionsService.downloadPdf(versionId, userId);
    // TODO: PHASE 4 - Return file stream or redirect to signed URL
    res.json({ url });
  }

  /**
   * GET /api/versions/:versionId/download/latex
   * Download LaTeX source
   * From apis.md Section 8.2
   * 
   * PHASE 2: Placeholder only (file download in PHASE 4)
   */
  @Get(':versionId/download/latex')
  async downloadLatex(
    @Param('versionId') versionId: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.versionsService.downloadLatex(versionId, userId);
    // TODO: PHASE 4 - Return file stream with proper headers
    res.json({ content });
  }
}

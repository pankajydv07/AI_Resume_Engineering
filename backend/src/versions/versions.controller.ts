import { Controller, Get, Put, Post, Param, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
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
 * PHASE 1: SCAFFOLDING ONLY
 * - No authentication guard yet
 * - Placeholder responses only
 */
@Controller('versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  /**
   * GET /api/versions/:versionId
   * Get a specific resume version
   * From apis.md Section 4.1
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Verify user ownership
   */
  @Get(':versionId')
  async getVersion(@Param('versionId') versionId: string): Promise<ResumeVersionDto> {
    return this.versionsService.getVersion(versionId);
  }

  /**
   * PUT /api/versions/:versionId
   * Save manual resume edit (creates new MANUAL version)
   * From apis.md Section 4.2
   * 
   * Important: NEVER overwrites existing version
   * Creates new version with parentVersionId
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Verify user ownership of parent version
   */
  @Put(':versionId')
  async saveEdit(
    @Param('versionId') versionId: string,
    @Body() saveEditDto: SaveResumeEditDto,
  ): Promise<SaveResumeEditResponseDto> {
    return this.versionsService.saveEdit(versionId, saveEditDto);
  }

  /**
   * POST /api/versions/:versionId/compile
   * Compile resume version to PDF
   * From apis.md Section 4.3
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Verify user ownership
   */
  @Post(':versionId/compile')
  async compileVersion(@Param('versionId') versionId: string): Promise<CompileResumeResponseDto> {
    return this.versionsService.compileVersion(versionId);
  }

  /**
   * GET /api/versions/diff
   * Get diff between two versions
   * From apis.md Section 7.1
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Verify user ownership of both versions
   */
  @Get('diff')
  async getVersionDiff(
    @Query('from') fromVersionId: string,
    @Query('to') toVersionId: string,
  ): Promise<VersionDiffDto> {
    return this.versionsService.getVersionDiff(fromVersionId, toVersionId);
  }

  /**
   * GET /api/versions/:versionId/download/pdf
   * Download PDF version
   * From apis.md Section 8.1
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Return file stream or signed URL
   * TODO: Verify version is COMPILED
   */
  @Get(':versionId/download/pdf')
  async downloadPdf(
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.versionsService.downloadPdf(versionId);
    // Placeholder - redirect to PDF URL
    res.json({ url });
  }

  /**
   * GET /api/versions/:versionId/download/latex
   * Download LaTeX source
   * From apis.md Section 8.2
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Return file stream
   */
  @Get(':versionId/download/latex')
  async downloadLatex(
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.versionsService.downloadLatex(versionId);
    // Placeholder - return content as JSON
    res.json({ content });
  }
}

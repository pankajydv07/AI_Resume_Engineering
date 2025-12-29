import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiJobsService } from './ai-jobs.service';
import { StartAiTailoringDto, StartAiTailoringResponseDto, AiJobStatusDto } from './dto/ai-job.dto';

/**
 * AI Jobs Controller
 * 
 * Handles AI tailoring operations
 * All endpoints from apis.md Section 6
 * 
 * PHASE 5: AI JOB INFRASTRUCTURE (NO REWRITING)
 * - ClerkAuthGuard active
 * - Ownership verified via project relationship
 * - Real database operations for AIJob storage and retrieval
 */
@Controller('ai')
@UseGuards(ClerkAuthGuard)
export class AiJobsController {
  constructor(private readonly aiJobsService: AiJobsService) {}

  /**
   * POST /api/ai/tailor
   * Start AI tailoring job
   * From apis.md Section 6.1
   * 
   * PHASE 5: Database persistence ONLY
   * - Creates AIJob with status=QUEUED
   * - Verifies user owns project, baseVersion, and JD
   * - NO AI execution in this phase
   * 
   * Rules from apis.md:
   * - Async only (no blocking responses)
   * - Returns jobId immediately
   */
  @Post('tailor')
  async startTailoring(
    @Body() startTailoringDto: StartAiTailoringDto,
    @CurrentUser() userId: string,
  ): Promise<StartAiTailoringResponseDto> {
    return this.aiJobsService.startTailoring(startTailoringDto, userId);
  }

  /**
   * GET /api/ai/jobs/:jobId
   * Get AI job status
   * From apis.md Section 6.2
   * 
   * PHASE 5: Database retrieval ONLY
   * - Returns current AIJob status
   * - Verifies user owns the job via project
   * 
   * Frontend behavior from apis.md:
   * - Poll until COMPLETED or FAILED
   */
  @Get('jobs/:jobId')
  async getJobStatus(
    @Param('jobId') jobId: string,
    @CurrentUser() userId: string,
  ): Promise<AiJobStatusDto> {
    return this.aiJobsService.getJobStatus(jobId, userId);
  }
}

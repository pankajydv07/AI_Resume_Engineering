import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { AiJobsService } from './ai-jobs.service';
import { StartAiTailoringDto, StartAiTailoringResponseDto, AiJobStatusDto } from './dto/ai-job.dto';

/**
 * AI Jobs Controller
 * 
 * Handles AI tailoring operations
 * All endpoints from apis.md Section 6
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - No authentication guard yet
 * - Placeholder responses only
 */
@Controller('ai')
export class AiJobsController {
  constructor(private readonly aiJobsService: AiJobsService) {}

  /**
   * POST /api/ai/tailor
   * Start AI tailoring job
   * From apis.md Section 6.1
   * 
   * Rules from apis.md:
   * - Async only (no blocking responses)
   * - Returns jobId immediately
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Verify user owns project, baseVersion, and JD
   */
  @Post('tailor')
  async startTailoring(
    @Body() startTailoringDto: StartAiTailoringDto,
  ): Promise<StartAiTailoringResponseDto> {
    return this.aiJobsService.startTailoring(startTailoringDto);
  }

  /**
   * GET /api/ai/jobs/:jobId
   * Get AI job status
   * From apis.md Section 6.2
   * 
   * Frontend behavior from apis.md:
   * - Poll until COMPLETED or FAILED
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Verify user owns the job
   */
  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string): Promise<AiJobStatusDto> {
    return this.aiJobsService.getJobStatus(jobId);
  }
}

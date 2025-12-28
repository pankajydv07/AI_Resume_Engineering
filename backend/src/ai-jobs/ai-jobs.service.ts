import { Injectable } from '@nestjs/common';
import { StartAiTailoringDto, StartAiTailoringResponseDto, AiJobStatusDto } from './dto/ai-job.dto';

/**
 * AI Jobs Service
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - Returns placeholder data
 * - No database logic
 * - No async job processing
 * - No AI logic
 * 
 * From apis.md Section 6
 */
@Injectable()
export class AiJobsService {
  /**
   * Start AI tailoring job
   * From apis.md Section 6.1
   * 
   * Rules from apis.md:
   * - Async only (no blocking responses)
   * - Frontend polls for status
   * 
   * TODO: Implement database logic
   * TODO: Create AIJob entity with status=QUEUED
   * TODO: Verify user owns project, baseVersion, and JD
   * TODO: Queue async job for AI processing
   * TODO: Job should create new AI_GENERATED version when complete
   */
  async startTailoring(startTailoringDto: StartAiTailoringDto): Promise<StartAiTailoringResponseDto> {
    // Placeholder response
    return {
      jobId: 'placeholder-ai-job-' + Date.now(),
    };
  }

  /**
   * Get AI job status
   * From apis.md Section 6.2
   * 
   * Frontend behavior from apis.md:
   * - Poll until COMPLETED or FAILED
   * 
   * TODO: Implement database logic
   * TODO: Query AIJob table
   * TODO: Return current status
   * TODO: Include newVersionId when COMPLETED
   * TODO: Include errorMessage when FAILED
   */
  async getJobStatus(jobId: string): Promise<AiJobStatusDto> {
    // Placeholder response - simulate QUEUED status
    return {
      jobId,
      status: 'QUEUED',
      newVersionId: null,
      errorMessage: null,
    };
  }
}

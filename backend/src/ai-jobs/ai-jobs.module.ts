import { Module } from '@nestjs/common';
import { AiJobsController } from './ai-jobs.controller';
import { AiJobsService } from './ai-jobs.service';
import { DiffService } from './diff.service';

/**
 * AI Jobs Module
 * 
 * Handles AI tailoring operations
 * From apis.md Section 6
 */
@Module({
  controllers: [AiJobsController],
  providers: [AiJobsService, DiffService],
  exports: [AiJobsService],
})
export class AiJobsModule {}

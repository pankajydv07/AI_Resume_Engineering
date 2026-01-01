import { Module } from '@nestjs/common';
import { AiJobsController } from './ai-jobs.controller';
import { AiJobsService } from './ai-jobs.service';
import { DiffService } from './diff.service';
import { VersionsModule } from '../versions/versions.module';

/**
 * AI Jobs Module
 * 
 * Handles AI tailoring operations
 * From apis.md Section 6
 * 
 * GOAL 3: Import VersionsModule for SectionsService access
 */
@Module({
  imports: [VersionsModule],
  controllers: [AiJobsController],
  providers: [AiJobsService, DiffService],
  exports: [AiJobsService],
})
export class AiJobsModule {}

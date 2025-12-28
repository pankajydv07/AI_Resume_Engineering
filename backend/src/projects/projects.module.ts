import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

/**
 * Projects Module
 * 
 * Handles resume project operations
 * From apis.md Section 3
 * 
 * PHASE 2 HARDENING: Base version created in transaction (no external dependency)
 */
@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

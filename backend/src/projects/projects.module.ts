import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { VersionsModule } from '../versions/versions.module';

/**
 * Projects Module
 * 
 * Handles resume project operations
 * From apis.md Section 3
 * 
 * PHASE 2: Now imports VersionsModule to access active version endpoint
 */
@Module({
  imports: [VersionsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

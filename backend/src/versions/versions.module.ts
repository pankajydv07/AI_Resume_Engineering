import { Module } from '@nestjs/common';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';

/**
 * Versions Module
 * 
 * Handles resume version operations
 * From apis.md Sections 4, 7, 8
 */
@Module({
  controllers: [VersionsController],
  providers: [VersionsService],
  exports: [VersionsService],
})
export class VersionsModule {}

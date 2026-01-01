import { Module } from '@nestjs/common';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';
import { SectionsService } from './sections.service';
import { LatexParserService } from './latex-parser.service';

/**
 * Versions Module
 * 
 * Handles resume version operations
 * From apis.md Sections 4, 7, 8
 * 
 * GOAL 1: Added SectionsService for section-level operations
 * GOAL 2: Added LatexParserService for extraction & assembly
 */
@Module({
  controllers: [VersionsController],
  providers: [VersionsService, SectionsService, LatexParserService],
  exports: [VersionsService, SectionsService, LatexParserService],
})
export class VersionsModule {}

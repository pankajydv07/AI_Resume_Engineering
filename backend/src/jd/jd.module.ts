import { Module } from '@nestjs/common';
import { JdController } from './jd.controller';
import { JdService } from './jd.service';

/**
 * Job Description Module
 * 
 * Handles job description submission and analysis
 * From apis.md Section 5
 */
@Module({
  controllers: [JdController],
  providers: [JdService],
  exports: [JdService],
})
export class JdModule {}

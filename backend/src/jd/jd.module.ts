import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JdController } from './jd.controller';
import { JdService } from './jd.service';

/**
 * Job Description Module
 * 
 * Handles job description submission and storage
 * From apis.md Section 5
 * 
 * PHASE 4: JD INTAKE (DATA ONLY)
 * - Imports PrismaModule for database operations
 */
@Module({
  imports: [PrismaModule],
  controllers: [JdController],
  providers: [JdService],
  exports: [JdService],
})
export class JdModule {}

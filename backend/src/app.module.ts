import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './projects/projects.module';
import { VersionsModule } from './versions/versions.module';
import { JdModule } from './jd/jd.module';
import { AiJobsModule } from './ai-jobs/ai-jobs.module';
import { AuthModule } from './auth/auth.module';

/**
 * App Module
 * 
 * Root module that ties all feature modules together
 * 
 * PHASE 1: SCAFFOLDING
 * - All modules scaffolded
 * - No Prisma module yet (no database connection)
 * - No background job processing
 * 
 * Modules follow structure from apis.md:
 * - Projects (Section 3)
 * - Versions (Sections 4, 7, 8)
 * - JD (Section 5)
 * - AI Jobs (Section 6)
 * - Auth (Section 2)
 */
@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Feature modules
    AuthModule,
    ProjectsModule,
    VersionsModule,
    JdModule,
    AiJobsModule,
    
    // TODO: Add PrismaModule when implementing database
    // TODO: Add background job processing module (Bull/BullMQ)
  ],
})
export class AppModule {}

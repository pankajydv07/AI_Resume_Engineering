import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './projects/projects.module';
import { VersionsModule } from './versions/versions.module';
import { JdModule } from './jd/jd.module';
import { AiJobsModule } from './ai-jobs/ai-jobs.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ApiKeysModule } from './api-keys/api-keys.module';

/**
 * App Module
 * 
 * Root module that ties all feature modules together
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - PrismaModule active (database connection)
 * - UsersModule active (user persistence)
 * - ConfigModule loads DATABASE_URL from .env
 * 
 * Modules follow structure from apis.md:
 * - Projects (Section 3)
 * - Versions (Sections 4, 7, 8)
 * - JD (Section 5)
 * - AI Jobs (Section 6)
 * - Auth (Section 2)
 * - Prisma (database layer)
 * - Users (internal user persistence)
 */
@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database layer
    PrismaModule, // Global module providing PrismaService
    
    // Core modules
    UsersModule, // User persistence (internal, no API endpoints)
    
    // Feature modules
    AuthModule,
    ProjectsModule,
    VersionsModule,
    JdModule,
    AiJobsModule,
    ApiKeysModule,
    
    // TODO (PHASE 4+): Add background job processing module (Bull/BullMQ)
  ],
})
export class AppModule {}

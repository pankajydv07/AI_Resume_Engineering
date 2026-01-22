import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ProjectsModule } from './projects/projects.module';
import { VersionsModule } from './versions/versions.module';
import { JdModule } from './jd/jd.module';
import { AiJobsModule } from './ai-jobs/ai-jobs.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { SecurityModule } from './common/security/security.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';

/**
 * App Module
 * 
 * Root module that ties all feature modules together
 * 
 * SECURITY HARDENING:
 * - SecurityModule provides rate limiting (ThrottlerModule)
 * - CustomThrottlerGuard applied globally for IP + user-based limiting
 * - All endpoints protected by default rate limits
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
    
    // SECURITY: Rate limiting module
    SecurityModule,
    
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
  ],
  providers: [
    // SECURITY: Global rate limiting guard (IP + user-based)
    // Default: 100 requests/minute for standard endpoints
    // Override with @Throttle() decorator for specific endpoints
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}

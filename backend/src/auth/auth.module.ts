import { Module } from '@nestjs/common';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { UsersModule } from '../users/users.module';

/**
 * Auth Module
 * 
 * Handles authentication via Clerk
 * From apis.md Section 2
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - ClerkAuthGuard now creates/finds users in database
 * - Imports UsersModule for user persistence
 * 
 * TODO (PHASE 3): Add Clerk SDK
 * TODO (PHASE 3): Implement JWT validation
 * TODO (PHASE 3): Add auth configuration
 */
@Module({
  imports: [UsersModule], // Import to use UsersService in ClerkAuthGuard
  providers: [ClerkAuthGuard],
  exports: [ClerkAuthGuard],
})
export class AuthModule {}

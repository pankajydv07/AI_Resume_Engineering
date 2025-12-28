import { Module } from '@nestjs/common';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';

/**
 * Auth Module
 * 
 * Handles authentication via Clerk
 * From apis.md Section 2
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - Placeholder guard only
 * - No actual JWT validation
 * 
 * TODO: Add Clerk SDK
 * TODO: Implement JWT validation
 * TODO: Add auth configuration
 */
@Module({
  providers: [ClerkAuthGuard],
  exports: [ClerkAuthGuard],
})
export class AuthModule {}

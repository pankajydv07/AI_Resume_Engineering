import { Module, Global } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * Users Module
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - Provides UsersService for user persistence
 * - Global module (available everywhere without importing)
 * - No controllers (not exposed as API endpoints)
 * - Used internally by other modules
 * 
 * From database.md:
 * - Manages User table operations
 * 
 * TODO (PHASE 3+): Add user profile endpoints if needed
 * TODO (PHASE 3+): Add user settings management
 */
@Global() // Makes UsersService available everywhere
@Module({
  providers: [UsersService],
  exports: [UsersService], // Available for other modules to inject
})
export class UsersModule {}

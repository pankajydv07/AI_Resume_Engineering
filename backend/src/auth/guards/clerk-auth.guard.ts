import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

/**
 * Clerk Auth Guard
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - Creates/finds user in database
 * - Still using mock clerkId (no real JWT validation yet)
 * - Attaches internal userId to request
 * 
 * From apis.md Section 2:
 * - Auth: Clerk JWT (validated by backend guard)
 * - Backend receives userId from auth guard
 * 
 * TODO (PHASE 3): Implement Clerk JWT validation
 * TODO (PHASE 3): Extract clerkId and email from real JWT
 * TODO (PHASE 3): Handle invalid/missing tokens
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // PHASE 2: Mock authentication with user persistence
    // TODO (PHASE 3): Replace with real Clerk JWT validation
    const mockClerkId = 'mock-clerk-id-' + Date.now();
    const mockEmail = 'dev@example.com';
    
    // Find or create user in database
    const user = await this.usersService.findOrCreateByClerkId(
      mockClerkId,
      mockEmail,
    );
    
    // Attach internal user ID to request
    request.userId = user.id;
    
    return true;
  }
}


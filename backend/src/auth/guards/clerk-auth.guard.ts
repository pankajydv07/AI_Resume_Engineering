import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { UsersService } from '../../users/users.service';

/**
 * Clerk Auth Guard
 * 
 * PHASE 8: REAL AUTHENTICATION & AUTHORIZATION
 * - Validates Clerk JWT from Authorization header
 * - Extracts user information from verified token
 * - Creates/finds user in database
 * - Attaches internal userId to request
 * 
 * From apis.md Section 2:
 * - Auth: Clerk JWT (validated by backend guard)
 * - Backend receives userId from auth guard
 * 
 * Environment Requirements:
 * - CLERK_SECRET_KEY must be set in .env
 * 
 * Security:
 * - Rejects requests without valid JWT
 * - Validates JWT signature with Clerk
 * - Fetches user data from Clerk API
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    try {
      // Verify JWT with Clerk - using standalone verifyToken function
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      
      // Extract Clerk user ID from verified token payload
      const clerkUserId = payload.sub;
      
      if (!clerkUserId) {
        throw new UnauthorizedException('User ID not found in token');
      }

      // Fetch user details from Clerk
      const clerkUser = await this.clerkClient.users.getUser(clerkUserId);
      
      // Get primary email address
      const primaryEmail = clerkUser.emailAddresses.find(
        email => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

      if (!primaryEmail) {
        throw new UnauthorizedException('User has no email address');
      }

      // Find or create user in our database
      const user = await this.usersService.findOrCreateByClerkId(
        clerkUserId,
        primaryEmail,
      );
      
      // Attach internal user ID to request for use in controllers
      request.userId = user.id;
      
      return true;
    } catch (error) {
      // Handle verification errors
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      console.error('Clerk JWT verification failed:', error);
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}


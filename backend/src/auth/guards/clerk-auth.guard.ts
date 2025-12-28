import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Clerk Auth Guard (PLACEHOLDER)
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - No actual authentication logic
 * - Always allows requests through
 * 
 * From apis.md Section 2:
 * - Auth: Clerk JWT (validated by backend guard)
 * - Backend receives userId from auth guard
 * 
 * TODO: Implement Clerk JWT validation
 * TODO: Extract userId from Clerk JWT
 * TODO: Attach userId to request object
 * TODO: Handle invalid/missing tokens
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // PLACEHOLDER: Always allow for now
    // TODO: Validate Clerk JWT from Authorization header
    // TODO: Extract userId and attach to request
    
    // Mock userId for development
    request.userId = 'mock-user-id-' + Date.now();
    
    return true;
  }
}

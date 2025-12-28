import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser Decorator (PLACEHOLDER)
 * 
 * Extracts userId from request (set by ClerkAuthGuard)
 * 
 * Usage in controllers:
 * @Get()
 * async getData(@CurrentUser() userId: string) { ... }
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - Returns mock userId
 * 
 * TODO: Extract actual userId from validated Clerk JWT
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // Return userId set by ClerkAuthGuard
    return request.userId || 'mock-user-id';
  },
);

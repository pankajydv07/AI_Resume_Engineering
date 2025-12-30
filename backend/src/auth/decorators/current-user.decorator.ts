import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser Decorator
 * 
 * PHASE 8: REAL AUTHENTICATION
 * Extracts userId from request (set by ClerkAuthGuard)
 * 
 * Usage in controllers:
 * @Get()
 * async getData(@CurrentUser() userId: string) { ... }
 * 
 * Security:
 * - userId is guaranteed to exist (set by ClerkAuthGuard)
 * - No fallback to mock data
 * - Guards must be applied to routes using this decorator
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // Return userId set by ClerkAuthGuard (guaranteed to exist if guard passed)
    return request.userId;
  },
);

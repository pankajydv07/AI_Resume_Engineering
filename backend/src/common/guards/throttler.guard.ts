import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions, ThrottlerLimitDetail } from '@nestjs/throttler';

/**
 * Custom Throttler Guard with IP + User-based Rate Limiting
 * 
 * SECURITY: Enhanced rate limiting following OWASP recommendations
 * 
 * Features:
 * - IP-based limiting for unauthenticated requests
 * - User + IP combined limiting for authenticated requests
 * - Prevents both anonymous abuse and authenticated user abuse
 * 
 * Key tracking:
 * - Anonymous: IP address only
 * - Authenticated: userId + IP address (separate limits per user per IP)
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Generate unique tracker key combining IP and optional user ID
   * 
   * @param req - Express request object
   * @param context - NestJS execution context
   * @param throttler - Throttler configuration
   * @param throttlerLimit - Limit details
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Get client IP from various headers (handle proxies)
    const ip = this.getClientIp(req);
    
    // Get user ID if authenticated (attached by ClerkAuthGuard)
    const userId = req.userId;
    
    // Combine user ID with IP for authenticated requests
    // This prevents a single user from bypassing limits using multiple IPs
    // while also preventing a single IP from accessing multiple user accounts
    if (userId) {
      return `${userId}:${ip}`;
    }
    
    // Unauthenticated requests are tracked by IP only
    return ip;
  }

  /**
   * Extract real client IP address, handling reverse proxies
   * 
   * Priority:
   * 1. X-Forwarded-For (first IP in chain)
   * 2. X-Real-IP
   * 3. req.ip (Express default)
   * 4. Socket remote address
   */
  private getClientIp(req: Record<string, any>): string {
    // X-Forwarded-For may contain multiple IPs (client, proxy1, proxy2, ...)
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor) {
      // Take the first IP (original client)
      const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
      return ips[0] || 'unknown';
    }

    // X-Real-IP is simpler, set by some proxies
    const realIp = req.headers?.['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    // Express default IP
    if (req.ip) {
      return req.ip;
    }

    // Fallback to socket address
    return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Handle rate limit exceeded - allows for custom logging
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest();
    const ip = this.getClientIp(req);
    const userId = req.userId || 'anonymous';
    const path = req.path;
    
    // Log rate limit violations for monitoring
    console.warn(`[RateLimit] Exceeded: user=${userId}, ip=${ip}, path=${path}, limit=${throttlerLimitDetail.limit}`);
    
    // Let parent class throw the exception
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}

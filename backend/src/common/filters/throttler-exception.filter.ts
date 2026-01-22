import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

/**
 * Custom Throttler Exception Filter
 * 
 * SECURITY: Rate limiting with graceful 429 responses (OWASP recommendation)
 * 
 * Provides:
 * - Standard JSON error response format
 * - Retry-After header for client guidance
 * - No sensitive information disclosure
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Calculate retry delay (default to 60 seconds if not available)
    const retryAfterSeconds = 60;

    response
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .header('Retry-After', String(retryAfterSeconds))
      .header('X-RateLimit-Reset', String(Date.now() + retryAfterSeconds * 1000))
      .json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: retryAfterSeconds,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      });
  }
}

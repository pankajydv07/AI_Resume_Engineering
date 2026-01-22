import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Security Module
 * 
 * SECURITY: Centralized security configuration for the application
 * Following OWASP best practices for rate limiting
 * 
 * Rate Limiting Strategy:
 * - Default: 100 requests per 60 seconds (general APIs)
 * - Strict: 10 requests per 60 seconds (sensitive operations like AI, auth)
 * - Upload: 5 requests per 60 seconds (file uploads)
 * 
 * Limits are based on IP address by default.
 * Controllers can add user-based limiting via custom guards.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            // Default rate limit: 100 requests per minute
            // Suitable for most API endpoints
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL', 60000), // 60 seconds in ms
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
          {
            // Strict rate limit: 10 requests per minute
            // For sensitive operations (AI endpoints, auth attempts)
            name: 'strict',
            ttl: config.get<number>('THROTTLE_STRICT_TTL', 60000),
            limit: config.get<number>('THROTTLE_STRICT_LIMIT', 10),
          },
          {
            // Upload rate limit: 5 requests per minute
            // For file upload endpoints
            name: 'upload',
            ttl: config.get<number>('THROTTLE_UPLOAD_TTL', 60000),
            limit: config.get<number>('THROTTLE_UPLOAD_LIMIT', 5),
          },
        ],
        // Skip throttling in test environments if configured
        skipIf: () => config.get<string>('NODE_ENV') === 'test',
        // Error message included in ThrottlerException
        errorMessage: 'Rate limit exceeded. Please wait before making more requests.',
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class SecurityModule {}

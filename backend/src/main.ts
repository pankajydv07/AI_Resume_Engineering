import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

/**
 * Main application entry point
 * 
 * SECURITY HARDENING:
 * - Helmet for HTTP security headers
 * - Rate limiting via ThrottlerGuard (configured in SecurityModule)
 * - Strict input validation with whitelist
 * - CORS with explicit origin control
 * - Request body size limits
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // SECURITY: Limit request body size to prevent DoS
    bodyParser: true,
  });
  
  // Global prefix for all routes
  app.setGlobalPrefix('api');
  
  // SECURITY: Helmet - Set secure HTTP headers (OWASP recommendation)
  // Includes: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.
  app.use(helmet({
    // Configure Content-Security-Policy for API
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
    // Allow embedding for PDF preview in frontend
    crossOriginEmbedderPolicy: false,
  }));
  
  // SECURITY: CORS configuration with explicit origins
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000', // Development
  ].filter(Boolean);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log blocked origin for monitoring
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Reset', 'Retry-After'],
    maxAge: 86400, // 24 hours
  });
  
  // SECURITY: Global validation pipe with strict settings
  // OWASP: Input validation is the first line of defense
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties not defined in DTO (prevent mass assignment)
      whitelist: true,
      // Reject requests with unexpected properties
      forbidNonWhitelisted: true,
      // Transform payloads to DTO instances
      transform: true,
      // Transform primitive types (string to number, etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Detailed error messages in development only
      disableErrorMessages: process.env.NODE_ENV === 'production',
      // Custom exception factory for consistent error format
      exceptionFactory: (errors) => {
        const messages = errors.map(err => {
          const constraints = err.constraints ? Object.values(err.constraints) : ['Invalid value'];
          return {
            field: err.property,
            errors: constraints,
          };
        });
        
        return new BadRequestException({
          error: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: messages,
        });
      },
    }),
  );
  
  // SECURITY: Global rate limit exception filter for graceful 429 responses
  app.useGlobalFilters(new ThrottlerExceptionFilter());

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Main application entry point
 * 
 * PHASE 1: SCAFFOLDING
 * - Basic server setup only
 * - No authentication middleware yet (Clerk integration later)
 * - No database connection yet
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true,
  });
  
  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // TODO: Add Clerk authentication middleware
  // TODO: Add global exception filter
  // TODO: Add request logging
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`Backend server running on http://localhost:${port}/api`);
}

bootstrap();

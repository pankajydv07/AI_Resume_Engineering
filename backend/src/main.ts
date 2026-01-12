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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`Server running on port ${port}`);
}
bootstrap();

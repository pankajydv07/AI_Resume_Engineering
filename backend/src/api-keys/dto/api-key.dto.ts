import { IsEnum, IsNotEmpty, IsString, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { AIModelProvider } from '@prisma/client';

/**
 * DTO for storing a new API key
 * 
 * SECURITY VALIDATION:
 * - Provider must be from allowed enum
 * - API key has length limits (8-500 chars)
 * - Endpoint must be valid HTTPS URL
 * - All inputs sanitized via Transform
 */
export class StoreApiKeyDto {
  @IsEnum(AIModelProvider, { message: 'Invalid AI model provider' })
  @IsNotEmpty({ message: 'Provider is required' })
  provider: AIModelProvider;

  @IsString({ message: 'API key must be a string' })
  @IsNotEmpty({ message: 'API key is required' })
  @MinLength(8, { message: 'API key must be at least 8 characters' })
  @MaxLength(500, { message: 'API key must not exceed 500 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  apiKey: string;

  @IsString({ message: 'Endpoint must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Endpoint URL must not exceed 500 characters' })
  @Matches(/^https:\/\/.+/, { message: 'Endpoint must be a valid HTTPS URL' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  endpoint?: string;
}

/**
 * Response DTO for API key operations
 * 
 * SECURITY: Raw API key is NEVER included in responses
 */
export class ApiKeyResponseDto {
  id: string;
  provider: AIModelProvider;
  endpoint: string | null;
  isValid: boolean;
  lastValidated: Date | null;
  validationError: string | null;
  createdAt: Date;
}

/**
 * Response DTO for API key validation
 */
export class ValidateApiKeyResponseDto {
  isValid: boolean;
  validationError: string | null;
  lastValidated: Date;
}

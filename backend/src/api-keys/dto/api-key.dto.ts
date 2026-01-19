import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { AIModelProvider } from '@prisma/client';

export class StoreApiKeyDto {
  @IsEnum(AIModelProvider)
  @IsNotEmpty()
  provider: AIModelProvider;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsOptional()
  endpoint?: string;
}

export class ApiKeyResponseDto {
  id: string;
  provider: AIModelProvider;
  endpoint: string | null;
  isValid: boolean;
  lastValidated: Date | null;
  validationError: string | null;
  createdAt: Date;
}

export class ValidateApiKeyResponseDto {
  isValid: boolean;
  validationError: string | null;
  lastValidated: Date;
}

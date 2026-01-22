import { IsUUID, IsEnum, IsArray, IsOptional, IsString, MaxLength, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { AIModelProvider } from '@prisma/client';

/**
 * DTO for starting AI tailoring job
 * From apis.md Section 6.1
 * 
 * SECURITY VALIDATION:
 * - All IDs must be valid UUIDs
 * - Mode must be from allowed enum
 * - Locked sections limited to prevent abuse
 * - User instructions have length limit
 */
export class StartAiTailoringDto {
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsUUID('4', { message: 'Base version ID must be a valid UUID' })
  baseVersionId: string;

  @IsUUID('4', { message: 'JD ID must be a valid UUID' })
  @IsOptional()
  jdId?: string;

  @IsEnum(['MINIMAL', 'BALANCED', 'AGGRESSIVE'], { 
    message: 'Mode must be MINIMAL, BALANCED, or AGGRESSIVE' 
  })
  mode: 'MINIMAL' | 'BALANCED' | 'AGGRESSIVE';

  @IsArray({ message: 'Locked sections must be an array' })
  @IsOptional()
  @ArrayMaxSize(20, { message: 'Cannot lock more than 20 sections' })
  @IsString({ each: true, message: 'Each locked section must be a string' })
  lockedSections?: string[];

  @IsString({ message: 'User instructions must be a string' })
  @IsOptional()
  @MaxLength(5000, { message: 'User instructions must not exceed 5000 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  userInstructions?: string;

  @IsEnum(AIModelProvider, { message: 'Invalid AI model provider' })
  @IsOptional()
  modelProvider?: AIModelProvider;
}

/**
 * Response DTO for starting AI tailoring job
 * From apis.md Section 6.1
 */
export class StartAiTailoringResponseDto {
  jobId: string;
}

/**
 * Response DTO for getting AI job status
 * From apis.md Section 6.2
 */
export class AiJobStatusDto {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  newVersionId: string | null;
  errorMessage: string | null;
}

/**
 * Response DTO for listing AI jobs for a project
 * From apis.md Section 6.3
 */
export class AiJobListItemDto {
  jobId: string;
  projectId: string;
  jdId: string;
  baseVersionId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

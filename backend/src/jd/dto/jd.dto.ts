import { IsString, IsUUID, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for submitting a job description
 * From apis.md Section 5.1
 * 
 * SECURITY VALIDATION:
 * - Project ID must be valid UUID
 * - Raw text has length limits (min 50, max 50000 chars)
 * - Input is trimmed
 */
export class SubmitJdDto {
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsString({ message: 'Raw text must be a string' })
  @IsNotEmpty({ message: 'Job description text is required' })
  @MinLength(50, { message: 'Job description must be at least 50 characters' })
  @MaxLength(50000, { message: 'Job description must not exceed 50000 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  rawText: string;
}

/**
 * Response DTO for submitting JD
 * From apis.md Section 5.1
 */
export class SubmitJdResponseDto {
  jdId: string;
}

/**
 * Response DTO for getting a job description
 * From apis.md Section 5.2
 * 
 * PHASE 4: Returns rawText only (no AI fields)
 */
export class JobDescriptionDto {
  jdId: string;
  projectId: string;
  rawText: string;
  createdAt: string;
}

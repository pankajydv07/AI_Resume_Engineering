import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for creating a resume project
 * From apis.md Section 3.1
 * 
 * SECURITY VALIDATION:
 * - Name is required with length limits (1-100 chars)
 * - Only alphanumeric, spaces, hyphens, underscores allowed
 * - Input is trimmed
 */
export class CreateProjectDto {
  @IsString({ message: 'Project name must be a string' })
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(1, { message: 'Project name must be at least 1 character' })
  @MaxLength(100, { message: 'Project name must not exceed 100 characters' })
  @Matches(/^[\w\s\-]+$/, { 
    message: 'Project name can only contain letters, numbers, spaces, hyphens, and underscores' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;
}

/**
 * Response DTO for project creation
 * From apis.md Section 3.1
 */
export class CreateProjectResponseDto {
  projectId: string;
}

/**
 * Request DTO for resume upload
 * PHASE 8: Upload functionality
 * 
 * SECURITY VALIDATION:
 * - Name is required with length limits
 * - Only safe characters allowed in name
 */
export class UploadResumeDto {
  @IsString({ message: 'Project name must be a string' })
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(1, { message: 'Project name must be at least 1 character' })
  @MaxLength(100, { message: 'Project name must not exceed 100 characters' })
  @Matches(/^[\w\s\-]+$/, { 
    message: 'Project name can only contain letters, numbers, spaces, hyphens, and underscores' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;
}

/**
 * Response DTO for listing projects
 * From apis.md Section 3.2
 */
export class ProjectListItemDto {
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
}

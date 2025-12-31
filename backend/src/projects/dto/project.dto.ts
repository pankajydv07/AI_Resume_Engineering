import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a resume project
 * From apis.md Section 3.1
 */
export class CreateProjectDto {
  @IsString()
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
 */
export class UploadResumeDto {
  @IsString()
  @IsNotEmpty()
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

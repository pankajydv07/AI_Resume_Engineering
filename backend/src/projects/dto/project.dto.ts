import { IsString } from 'class-validator';

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
 * Response DTO for listing projects
 * From apis.md Section 3.2
 */
export class ProjectListItemDto {
  projectId: string;
  name: string;
  updatedAt: string;
  versionCount: number;
}

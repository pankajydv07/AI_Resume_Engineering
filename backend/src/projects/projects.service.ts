import { Injectable } from '@nestjs/common';
import { CreateProjectDto, CreateProjectResponseDto, ProjectListItemDto } from './dto/project.dto';

/**
 * Projects Service
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - Returns placeholder data
 * - No database logic
 * - No Prisma usage
 * 
 * From apis.md Section 3
 */
@Injectable()
export class ProjectsService {
  /**
   * Create a new resume project
   * From apis.md Section 3.1
   * 
   * TODO: Implement database logic
   * TODO: Get userId from auth context
   * TODO: Create ResumeProject in database
   */
  async createProject(createProjectDto: CreateProjectDto): Promise<CreateProjectResponseDto> {
    // Placeholder response
    return {
      projectId: 'placeholder-uuid-' + Date.now(),
    };
  }

  /**
   * List all resume projects for authenticated user
   * From apis.md Section 3.2
   * 
   * TODO: Implement database logic
   * TODO: Get userId from auth context
   * TODO: Query ResumeProject table
   * TODO: Calculate versionCount for each project
   */
  async listProjects(): Promise<ProjectListItemDto[]> {
    // Placeholder response
    return [
      {
        projectId: 'placeholder-uuid-1',
        name: 'Backend Resume',
        updatedAt: new Date().toISOString(),
        versionCount: 3,
      },
      {
        projectId: 'placeholder-uuid-2',
        name: 'Frontend Resume',
        updatedAt: new Date().toISOString(),
        versionCount: 1,
      },
    ];
  }
}

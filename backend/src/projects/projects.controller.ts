import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateProjectResponseDto, ProjectListItemDto } from './dto/project.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Projects Controller
 * 
 * Handles resume project operations
 * All endpoints from apis.md Section 3
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - Placeholder auth guard (always allows, injects mock userId)
 * - Placeholder responses only
 */
@Controller('projects')
@UseGuards(ClerkAuthGuard) // Placeholder guard - always allows
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * POST /api/projects
   * Create a new resume project
   * From apis.md Section 3.1
   * 
   * PHASE 1: Uses placeholder auth
   * TODO: Implement real Clerk JWT validation
   */
  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() userId: string, // Mock userId from placeholder guard
  ): Promise<CreateProjectResponseDto> {
    console.log('[PHASE 1] Mock userId:', userId);
    return this.projectsService.createProject(createProjectDto);
  }

  /**
   * GET /api/projects
   * List all resume projects for authenticated user
   * From apis.md Section 3.2
   * 
   * PHASE 1: Uses placeholder auth
   * TODO: Implement real Clerk JWT validation
   * TODO: Filter projects by actual userId from DB
   */
  @Get()
  async listProjects(
    @CurrentUser() userId: string, // Mock userId from placeholder guard
  ): Promise<ProjectListItemDto[]> {
    console.log('[PHASE 1] Mock userId:', userId);
    return this.projectsService.listProjects();
  }
}

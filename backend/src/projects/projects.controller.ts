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
 * PHASE 2: PERSISTENCE LAYER
 * - Real database operations via ProjectsService
 * - User ownership enforced
 * - Real Clerk JWT authentication active
 */
@Controller('projects')
@UseGuards(ClerkAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * POST /api/projects
   * Create a new resume project
   * From apis.md Section 3.1
   * 
   * PHASE 2: Real database persistence
   * TODO (PHASE 3): Implement real Clerk JWT validation
   */
  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() userId: string, // Real DB userId from auth guard
  ): Promise<CreateProjectResponseDto> {
    return this.projectsService.createProject(userId, createProjectDto);
  }

  /**
   * GET /api/projects
   * List all resume projects for authenticated user
   * From apis.md Section 3.2
   * 
   * PHASE 2: Real database persistence with user filtering
   */
  @Get()
  async listProjects(
    @CurrentUser() userId: string,
  ): Promise<ProjectListItemDto[]> {
    return this.projectsService.listProjects(userId);
  }
}

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { VersionsService } from '../versions/versions.service';
import { CreateProjectDto, CreateProjectResponseDto, ProjectListItemDto } from './dto/project.dto';
import { ResumeVersionDto } from '../versions/dto/version.dto';
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
    private readonly versionsService: VersionsService,
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

  /**
   * GET /api/projects/:projectId/versions/active
   * Get the active version for a project
   * 
   * PHASE 2: Critical for editor loading
   * - Called after project creation to load base version
   * - Returns the ACTIVE version (base version is ACTIVE by default)
   */
  @Get(':projectId/versions/active')
  async getActiveVersion(
    @Param('projectId') projectId: string,
    @CurrentUser() userId: string,
  ): Promise<ResumeVersionDto> {
    return this.versionsService.getActiveVersionForProject(projectId, userId);
  }
}

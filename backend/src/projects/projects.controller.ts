import { Controller, Get, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, CreateProjectResponseDto, ProjectListItemDto, UploadResumeDto } from './dto/project.dto';
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
   */
  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() userId: string,
  ): Promise<CreateProjectResponseDto> {
    return this.projectsService.createProject(userId, createProjectDto);
  }

  /**
   * POST /api/projects/upload
   * Create project from uploaded resume (PDF or LaTeX)
   * 
   * PHASE 8: Resume upload functionality
   * - LaTeX: Store as-is
   * - PDF: Extract text, use AI to reconstruct LaTeX
   * - Creates BASE version
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, callback) => {
      const allowedMimes = ['application/pdf', 'application/x-tex', 'text/x-tex', 'text/plain'];
      const allowedExtensions = ['.pdf', '.tex'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Only PDF and LaTeX (.tex) files are allowed'), false);
      }
    },
  }))
  async uploadResume(
    @UploadedFile() file: any, // Express.Multer.File type
    @Body() uploadDto: UploadResumeDto,
    @CurrentUser() userId: string,
  ): Promise<CreateProjectResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.projectsService.createProjectFromUpload(userId, uploadDto.name, file);
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

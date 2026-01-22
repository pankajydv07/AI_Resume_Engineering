import { Controller, Get, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
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
 * SECURITY HARDENING:
 * - Rate limiting on all endpoints
 * - Strict file upload limits (type, size)
 * - User ownership enforcement
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
   * SECURITY: Rate limited (20 requests/minute)
   */
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
   * SECURITY HARDENING:
   * - Strict rate limit (5 uploads/minute) - prevents storage abuse
   * - File type validation (whitelist)
   * - File size limit (10MB max)
   * - Filename sanitization in service layer
   * 
   * PHASE 8: Resume upload functionality
   * - LaTeX: Store as-is
   * - PDF: Extract text, use AI to reconstruct LaTeX
   * - Creates BASE version
   */
  @Post('upload')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 uploads per minute
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
      files: 1, // Only one file at a time
    },
    fileFilter: (req, file, callback) => {
      // SECURITY: Whitelist allowed MIME types and extensions
      const allowedMimes = ['application/pdf', 'application/x-tex', 'text/x-tex', 'text/plain'];
      const allowedExtensions = ['.pdf', '.tex'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      // Validate both MIME type and extension for defense-in-depth
      const mimeAllowed = allowedMimes.includes(file.mimetype);
      const extensionAllowed = allowedExtensions.includes(fileExtension);
      
      if (mimeAllowed || extensionAllowed) {
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
   * Returns only projects owned by the authenticated user
   */
  @Get()
  async listProjects(
    @CurrentUser() userId: string,
  ): Promise<ProjectListItemDto[]> {
    return this.projectsService.listProjects(userId);
  }
}

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JdService } from './jd.service';
import { SubmitJdDto, SubmitJdResponseDto, JobDescriptionDto } from './dto/jd.dto';

/**
 * Job Description Controller
 * 
 * Handles job description submission and retrieval
 * All endpoints from apis.md Section 5
 * 
 * SECURITY HARDENING:
 * - Rate limiting on all endpoints
 * - Input validation via DTOs
 * - User ownership enforcement
 */
@Controller('jd')
@UseGuards(ClerkAuthGuard)
export class JdController {
  constructor(private readonly jdService: JdService) {}

  /**
   * POST /api/jd
   * Submit job description for storage
   * From apis.md Section 5.1
   * 
   * SECURITY: Rate limited (20 requests/minute)
   * - Stores rawText exactly as provided
   * - Verifies user owns the project
   */
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async submitJd(
    @Body() submitJdDto: SubmitJdDto,
    @CurrentUser() userId: string,
  ): Promise<SubmitJdResponseDto> {
    return this.jdService.submitJd(submitJdDto, userId);
  }

  /**
   * GET /api/jd/:jdId
   * Get job description by ID
   * From apis.md Section 5.2
   * 
   * - Returns rawText only (no AI fields)
   * - Verifies user owns the project
   */
  @Get(':jdId')
  async getJd(
    @Param('jdId') jdId: string,
    @CurrentUser() userId: string,
  ): Promise<JobDescriptionDto> {
    return this.jdService.getJd(jdId, userId);
  }

  /**
   * GET /api/jd/project/:projectId
   * List job descriptions for project
   * From apis.md Section 5.3
   * 
   * - Returns rawText only (no AI fields)
   * - Verifies user owns the project
   * - Sorted by createdAt DESC
   */
  @Get('project/:projectId')
  async listJdsForProject(
    @Param('projectId') projectId: string,
    @CurrentUser() userId: string,
  ): Promise<JobDescriptionDto[]> {
    return this.jdService.listJdsForProject(projectId, userId);
  }
}

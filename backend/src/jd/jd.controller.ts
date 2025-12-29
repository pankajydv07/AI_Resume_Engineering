import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JdService } from './jd.service';
import { SubmitJdDto, SubmitJdResponseDto } from './dto/jd.dto';

/**
 * Job Description Controller
 * 
 * Handles job description submission
 * All endpoints from apis.md Section 5
 * 
 * PHASE 4: JD INTAKE (DATA ONLY)
 * - ClerkAuthGuard active
 * - Ownership verified via project relationship
 * - Real database operations for JD storage
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
   * PHASE 4: Database persistence ONLY
   * - Stores rawText exactly as provided
   * - Verifies user owns the project
   * - NO AI analysis in this phase
   */
  @Post()
  async submitJd(
    @Body() submitJdDto: SubmitJdDto,
    @CurrentUser() userId: string,
  ): Promise<SubmitJdResponseDto> {
    return this.jdService.submitJd(submitJdDto, userId);
  }
}

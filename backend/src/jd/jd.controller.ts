import { Controller, Post, Body } from '@nestjs/common';
import { JdService } from './jd.service';
import { SubmitJdDto, SubmitJdResponseDto } from './dto/jd.dto';

/**
 * Job Description Controller
 * 
 * Handles job description submission and analysis
 * All endpoints from apis.md Section 5
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - No authentication guard yet
 * - Placeholder responses only
 */
@Controller('jd')
export class JdController {
  constructor(private readonly jdService: JdService) {}

  /**
   * POST /api/jd
   * Submit job description for analysis
   * From apis.md Section 5.1
   * 
   * Notes from apis.md:
   * - JD analysis happens internally (backend responsibility)
   * - Frontend does not process JD data
   * 
   * TODO: Add @UseGuards(ClerkAuthGuard)
   * TODO: Verify user owns the project
   */
  @Post()
  async submitJd(@Body() submitJdDto: SubmitJdDto): Promise<SubmitJdResponseDto> {
    return this.jdService.submitJd(submitJdDto);
  }
}

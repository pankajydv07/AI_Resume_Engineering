import { Injectable } from '@nestjs/common';
import { SubmitJdDto, SubmitJdResponseDto } from './dto/jd.dto';

/**
 * Job Description Service
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - Returns placeholder data
 * - No database logic
 * - No AI analysis
 * 
 * From apis.md Section 5
 */
@Injectable()
export class JdService {
  /**
   * Submit job description for analysis
   * From apis.md Section 5.1
   * 
   * Notes from apis.md:
   * - JD analysis happens internally
   * - Frontend does not process JD data
   * 
   * TODO: Implement database logic
   * TODO: Create JobDescription entity
   * TODO: Implement AI analysis to extract skills/keywords
   * TODO: Store extractedSkills and keywords in JSON fields
   * TODO: Determine roleType
   * TODO: Verify user owns the project
   */
  async submitJd(submitJdDto: SubmitJdDto): Promise<SubmitJdResponseDto> {
    // Placeholder response
    return {
      jdId: 'placeholder-jd-' + Date.now(),
    };
  }
}

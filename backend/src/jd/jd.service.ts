import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitJdDto, SubmitJdResponseDto } from './dto/jd.dto';

/**
 * Job Description Service
 * 
 * PHASE 4: JD INTAKE (DATA ONLY)
 * - Real database operations
 * - Ownership enforcement
 * - NO AI analysis (future phase)
 * 
 * From apis.md Section 5
 */
@Injectable()
export class JdService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit job description for storage
   * From apis.md Section 5.1
   * 
   * PHASE 4: Database persistence ONLY
   * - Creates JobDescription entity
   * - Stores rawText exactly as provided
   * - Verifies user owns the project
   * - extractedSkills, keywords, roleType remain empty/null (AI analysis in future phase)
   * 
   * Per apis.md:
   * - JD analysis happens internally (but NOT in this phase)
   * - Frontend does not process JD data
   */
  async submitJd(submitJdDto: SubmitJdDto, userId: string): Promise<SubmitJdResponseDto> {
    // Verify user owns the project
    const project = await this.prisma.resumeProject.findUnique({
      where: { id: submitJdDto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${submitJdDto.projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Create JobDescription with rawText ONLY
    // extractedSkills, keywords, roleType are populated by AI analysis in future phase
    const jobDescription = await this.prisma.jobDescription.create({
      data: {
        projectId: submitJdDto.projectId,
        rawText: submitJdDto.rawText,
        extractedSkills: {}, // Empty JSON object (placeholder for future AI analysis)
        keywords: {},        // Empty JSON object (placeholder for future AI analysis)
        roleType: '',        // Empty string (placeholder for future AI analysis)
      },
    });

    return {
      jdId: jobDescription.id,
    };
  }
}

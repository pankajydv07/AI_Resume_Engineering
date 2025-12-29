import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitJdDto, SubmitJdResponseDto, JobDescriptionDto } from './dto/jd.dto';

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

  /**
   * Get Job Description by ID
   * From apis.md Section 5.2
   * 
   * PHASE 4: Database retrieval ONLY
   * - Fetches JobDescription entity
   * - Returns rawText only (no AI fields)
   * - Verifies user owns the project
   */
  async getJd(jdId: string, userId: string): Promise<JobDescriptionDto> {
    const jobDescription = await this.prisma.jobDescription.findUnique({
      where: { id: jdId },
      include: { project: true },
    });

    if (!jobDescription) {
      throw new NotFoundException(`Job description ${jdId} not found`);
    }

    // Verify ownership via project relationship
    if (jobDescription.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this job description');
    }

    return {
      jdId: jobDescription.id,
      projectId: jobDescription.projectId,
      rawText: jobDescription.rawText,
      createdAt: jobDescription.createdAt.toISOString(),
    };
  }

  /**
   * List Job Descriptions for Project
   * From apis.md Section 5.3
   * 
   * PHASE 4: Database retrieval ONLY
   * - Fetches all JobDescriptions for project
   * - Returns rawText only (no AI fields)
   * - Verifies user owns the project
   * - Sorted by createdAt DESC
   */
  async listJdsForProject(projectId: string, userId: string): Promise<JobDescriptionDto[]> {
    // Verify user owns the project
    const project = await this.prisma.resumeProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Fetch all JDs for the project
    const jobDescriptions = await this.prisma.jobDescription.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return jobDescriptions.map(jd => ({
      jdId: jd.id,
      projectId: jd.projectId,
      rawText: jd.rawText,
      createdAt: jd.createdAt.toISOString(),
    }));
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartAiTailoringDto, StartAiTailoringResponseDto, AiJobStatusDto } from './dto/ai-job.dto';

/**
 * AI Jobs Service
 * 
 * PHASE 5: AI JOB INFRASTRUCTURE (NO REWRITING)
 * - Real database operations
 * - Ownership enforcement
 * - NO AI execution (placeholder only)
 * 
 * From apis.md Section 6
 */
@Injectable()
export class AiJobsService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Start AI tailoring job
   * From apis.md Section 6.1
   * 
   * PHASE 5: Database persistence ONLY
   * - Creates AIJob entity with status=QUEUED
   * - Verifies user owns project, baseVersion, and JD
   * - NO AI execution (placeholder for future phase)
   * 
   * Rules from apis.md:
   * - Async only (no blocking responses)
   * - Frontend polls for status
   */
  async startTailoring(
    startTailoringDto: StartAiTailoringDto,
    userId: string,
  ): Promise<StartAiTailoringResponseDto> {
    const { projectId, baseVersionId, jdId, mode } = startTailoringDto;

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

    // Verify baseVersion exists and belongs to the project
    const baseVersion = await this.prisma.resumeVersion.findUnique({
      where: { id: baseVersionId },
    });

    if (!baseVersion) {
      throw new NotFoundException(`Version ${baseVersionId} not found`);
    }

    if (baseVersion.projectId !== projectId) {
      throw new ForbiddenException('Version does not belong to this project');
    }

    // Verify JD exists and belongs to the project
    const jd = await this.prisma.jobDescription.findUnique({
      where: { id: jdId },
    });

    if (!jd) {
      throw new NotFoundException(`Job description ${jdId} not found`);
    }

    if (jd.projectId !== projectId) {
      throw new ForbiddenException('Job description does not belong to this project');
    }

    // Create AIJob with status=QUEUED
    const aiJob = await this.prisma.aIJob.create({
      data: {
        projectId,
        baseVersionId,
        jdId,
        mode,
        status: 'QUEUED',
        errorMessage: null,
      },
    });

    // TODO: Queue async AI processing job (future phase)
    // TODO: AI job should create new AI_GENERATED version when complete

    return {
      jobId: aiJob.id,
    };
  }

  /**
   * Get AI job status
   * From apis.md Section 6.2
   * 
   * PHASE 5: Database retrieval ONLY
   * - Queries AIJob table
   * - Returns current status
   * - Verifies ownership via project relationship
   * 
   * Frontend behavior from apis.md:
   * - Poll until COMPLETED or FAILED
   */
  async getJobStatus(jobId: string, userId: string): Promise<AiJobStatusDto> {
    const aiJob = await this.prisma.aIJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!aiJob) {
      throw new NotFoundException(`AI job ${jobId} not found`);
    }

    // Verify ownership via project relationship
    if (aiJob.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this AI job');
    }

    return {
      jobId: aiJob.id,
      status: aiJob.status,
      newVersionId: null, // TODO: Link to created version in future phase
      errorMessage: aiJob.errorMessage,
    };
  }
}

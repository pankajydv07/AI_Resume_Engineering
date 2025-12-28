import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, CreateProjectResponseDto, ProjectListItemDto } from './dto/project.dto';

/**
 * Projects Service
 * 
 * PHASE 2: PERSISTENCE LAYER
 * - Creates projects in database
 * - Creates base version atomically (transaction)
 * - Lists projects for user
 * - Enforces user ownership
 * 
 * From apis.md Section 3
 * From database.md: ResumeProject table
 * 
 * PHASE 2 HARDENING: Atomic project + version creation
 */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new resume project
   * From apis.md Section 3.1
   * 
   * PHASE 2: Database persistence with atomic transaction
   * - Creates ResumeProject record
   * - Creates initial BASE version
   * - Both operations are atomic (transaction)
   * - Links to authenticated user
   * - Returns projectId (UUID)
   * 
   * PHASE 2 HARDENING: Transaction ensures no orphaned projects
   */
  async createProject(
    userId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<CreateProjectResponseDto> {
    // PHASE 2 HARDENING: Use transaction to ensure atomicity
    // If base version creation fails, project creation is rolled back
    const result = await this.prisma.$transaction(async (tx) => {
      // Create project
      const project = await tx.resumeProject.create({
        data: {
          userId,
          name: createProjectDto.name,
        },
      });

      // Create base version atomically
      // If this fails, entire transaction rolls back
      await tx.resumeVersion.create({
        data: {
          projectId: project.id,
          parentVersionId: null, // Base version has no parent
          type: 'BASE',
          status: 'DRAFT',
          latexContent: '\\documentclass{article}\n\\begin{document}\n% Your resume content here\n\\end{document}',
          pdfUrl: null,
        },
      });

      return project;
    });

    return {
      projectId: result.id,
    };
  }

  /**
   * List all resume projects for authenticated user
   * From apis.md Section 3.2
   * 
   * PHASE 2: Database persistence
   * - Queries ResumeProject table
   * - Filters by userId (ownership enforcement)
   * - Counts versions per project
   */
  async listProjects(userId: string): Promise<ProjectListItemDto[]> {
    const projects = await this.prisma.resumeProject.findMany({
      where: {
        userId, // Enforce user ownership
      },
      include: {
        versions: {
          select: {
            id: true, // Only need count, not full data
          },
        },
      },
      orderBy: {
        updatedAt: 'desc', // Most recently updated first
      },
    });

    return projects.map((project) => ({
      projectId: project.id,
      name: project.name,
      updatedAt: project.updatedAt.toISOString(),
      versionCount: project.versions.length,
    }));
  }

  // TODO (PHASE 3+): Add getProjectById(projectId, userId)
  // TODO (PHASE 3+): Add updateProject(projectId, userId, data)
  // TODO (PHASE 3+): Add deleteProject(projectId, userId) - with cascade handling
}

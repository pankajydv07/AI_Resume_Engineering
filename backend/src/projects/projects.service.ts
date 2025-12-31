import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, CreateProjectResponseDto, ProjectListItemDto } from './dto/project.dto';
import OpenAI from 'openai';

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
  private openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    // Initialize OpenAI client for PDF to LaTeX conversion
    this.openai = new OpenAI({
      baseURL: 'https://api.tokenfactory.nebius.com/v1/',
      apiKey: process.env.NEBIUS_API_KEY,
    });
  }

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
          status: 'ACTIVE', // PHASE 2: Set to ACTIVE so editor can load it
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
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      versionCount: project.versions.length,
    }));
  }

  /**
   * Create project from uploaded resume file
   * PHASE 8: Resume upload functionality
   * 
   * Handles:
   * - LaTeX (.tex): Store as-is
   * - PDF: Extract text → AI converts to LaTeX
   * - Creates BASE version with uploaded/converted content
   */
  async createProjectFromUpload(
    userId: string,
    projectName: string,
    file: any, // Express.Multer.File type
  ): Promise<CreateProjectResponseDto> {
    let latexContent: string;

    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isTex = file.originalname.toLowerCase().endsWith('.tex') || 
                   ['application/x-tex', 'text/x-tex', 'text/plain'].includes(file.mimetype);

    if (isPdf) {
      // Extract text from PDF using pdf.js-extract
      const { PDFExtract } = require('pdf.js-extract');
      const pdfExtract = new PDFExtract();
      
      try {
        const data = await pdfExtract.extractBuffer(file.buffer);
        
        // Combine all text from all pages
        const extractedText = data.pages
          .map(page => page.content.map(item => item.str).join(' '))
          .join('\n\n');

        if (!extractedText || extractedText.trim().length === 0) {
          throw new BadRequestException('Could not extract text from PDF. Please ensure the PDF contains readable text.');
        }

        // Use AI to convert PDF text to LaTeX
        latexContent = await this.convertPdfTextToLatex(extractedText);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        console.error('PDF extraction error:', error);
        throw new BadRequestException(`Failed to process PDF: ${error.message}`);
      }
    } else if (isTex) {
      // Use LaTeX content as-is
      latexContent = file.buffer.toString('utf-8');

      // Basic validation that it looks like LaTeX
      if (!latexContent.includes('\\documentclass') && !latexContent.includes('\\begin{document}')) {
        throw new BadRequestException('Uploaded file does not appear to be valid LaTeX. Please check the file content.');
      }
    } else {
      throw new BadRequestException('Unsupported file type. Please upload a PDF or LaTeX (.tex) file.');
    }

    // Create project with uploaded content
    const result = await this.prisma.$transaction(async (tx) => {
      // Create project
      const project = await tx.resumeProject.create({
        data: {
          userId,
          name: projectName,
        },
      });

      // Create BASE version with uploaded/converted content
      await tx.resumeVersion.create({
        data: {
          projectId: project.id,
          parentVersionId: null,
          type: 'BASE',
          status: 'ACTIVE',
          latexContent: latexContent,
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
   * Convert extracted PDF text to LaTeX using AI
   * Uses Nebius AI to reconstruct resume structure
   * 
   * Note: Reconstruction may not be perfect, but provides a solid starting point
   */
  private async convertPdfTextToLatex(pdfText: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: `You are an expert LaTeX resume formatter. Convert the provided resume text into a well-structured LaTeX document.

Requirements:
- Use \\documentclass{article} or appropriate resume class
- Include proper sections: \\section{Education}, \\section{Experience}, etc.
- Format dates, job titles, and descriptions properly
- Preserve all information from the original
- Use clean, compilable LaTeX code
- Do NOT add fictional information
- Return ONLY the LaTeX code, no explanations

Output should be complete, compilable LaTeX that preserves the resume's content.`,
          },
          {
            role: 'user',
            content: `Convert this resume text to LaTeX:\n\n${pdfText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const latexContent = response.choices[0]?.message?.content;

      if (!latexContent) {
        throw new Error('AI did not return LaTeX content');
      }

      // Clean up markdown code blocks if AI wrapped output
      let cleanedLatex = latexContent.trim();
      if (cleanedLatex.startsWith('```latex')) {
        cleanedLatex = cleanedLatex.replace(/```latex\n?/, '').replace(/```\s*$/, '');
      } else if (cleanedLatex.startsWith('```')) {
        cleanedLatex = cleanedLatex.replace(/```\n?/, '').replace(/```\s*$/, '');
      }

      return cleanedLatex.trim();
    } catch (error) {
      // Log the error but throw it so the user knows AI conversion failed
      console.error('PDF to LaTeX conversion error:', error);
      throw new BadRequestException(
        'AI conversion failed. Please upload a LaTeX file directly or try again later.'
      );
    }
  }

  // TODO (PHASE 3+): Add getProjectById(projectId, userId)
  // TODO (PHASE 3+): Add updateProject(projectId, userId, data)
  // TODO (PHASE 3+): Add deleteProject(projectId, userId) - with cascade handling
}

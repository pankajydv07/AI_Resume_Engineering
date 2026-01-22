import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiJobsService } from './ai-jobs.service';
import { StartAiTailoringDto, StartAiTailoringResponseDto, AiJobStatusDto, AiJobListItemDto } from './dto/ai-job.dto';
import { AcceptProposalDto, AcceptProposalResponseDto, RejectProposalDto, RejectProposalResponseDto } from './dto/proposal.dto';
import { GetProposalResponseDto } from './dto/get-proposal.dto';
import { SendChatDto, ChatResponseDto } from './dto/chat.dto';

/**
 * AI Jobs Controller
 * 
 * Handles AI tailoring operations
 * All endpoints from apis.md Section 6
 * 
 * SECURITY HARDENING:
 * - Strict rate limiting on AI endpoints (expensive operations)
 * - Default: 10 requests/minute for AI operations
 * - Prevents abuse and controls API costs
 * 
 * PHASE 5: AI JOB INFRASTRUCTURE (NO REWRITING)
 * PHASE 6: AI RESUME TAILORING (PROPOSAL ONLY)
 * - ClerkAuthGuard active
 * - Ownership verified via project relationship
 * - Real database operations for AIJob storage and retrieval
 */
@Controller('ai')
@UseGuards(ClerkAuthGuard)
export class AiJobsController {
  constructor(private readonly aiJobsService: AiJobsService) {}

  /**
   * POST /api/ai/tailor
   * Start AI tailoring job
   * From apis.md Section 6.1
   * 
   * SECURITY: Strict rate limit (5 requests/minute) - expensive AI operation
   * 
   * PHASE 5: Database persistence ONLY
   * - Creates AIJob with status=QUEUED
   * - Verifies user owns project, baseVersion, and JD
   * - NO AI execution in this phase
   * 
   * Rules from apis.md:
   * - Async only (no blocking responses)
   * - Returns jobId immediately
   */
  @Post('tailor')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async startTailoring(
    @Body() startTailoringDto: StartAiTailoringDto,
    @CurrentUser() userId: string,
  ): Promise<StartAiTailoringResponseDto> {
    return this.aiJobsService.startTailoring(startTailoringDto, userId);
  }

  /**
   * GET /api/ai/jobs/project/:projectId
   * List all AI jobs for a project
   * From apis.md Section 6.3
   * 
   * Returns all AI tailoring jobs for the project
   * 
   * CRITICAL: This MUST be defined BEFORE jobs/:jobId route
   * to avoid route collision (NestJS matches routes in order)
   */
  @Get('jobs/project/:projectId')
  async listJobsForProject(
    @Param('projectId') projectId: string,
    @CurrentUser() userId: string,
  ): Promise<AiJobListItemDto[]> {
    return this.aiJobsService.listJobsForProject(projectId, userId);
  }

  /**
   * GET /api/ai/jobs/:jobId
   * Get AI job status
   * From apis.md Section 6.2
   * 
   * PHASE 5: Database retrieval ONLY
   * - Returns current AIJob status
   * - Verifies user owns the job via project
   * 
   * Frontend behavior from apis.md:
   * - Poll until COMPLETED or FAILED
   */
  @Get('jobs/:jobId')
  async getJobStatus(
    @Param('jobId') jobId: string,
    @CurrentUser() userId: string,
  ): Promise<AiJobStatusDto> {
    return this.aiJobsService.getJobStatus(jobId, userId);
  }

  /**
   * GET /api/ai/jobs/:jobId/proposal
   * Get proposal content for completed AI job
   * PHASE 6: Proposal retrieval
   * 
   * Returns proposedLatexContent from ProposedVersion
   */
  @Get('jobs/:jobId/proposal')
  async getProposal(
    @Param('jobId') jobId: string,
    @CurrentUser() userId: string,
  ): Promise<GetProposalResponseDto> {
    return this.aiJobsService.getProposal(jobId, userId);
  }

  /**
   * POST /api/ai/proposal/accept
   * Accept AI proposal and create new resume version
   * PHASE 6: Proposal acceptance
   * 
   * SECURITY: Rate limited (10 requests/minute)
   * 
   * Behavior:
   * - Creates AI_GENERATED ResumeVersion from ProposedVersion
   * - Sets parentVersionId to baseVersionId
   * - Returns new versionId
   * 
   * Forbidden:
   * - No partial acceptance
   * - No silent apply
   */
  @Post('proposal/accept')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async acceptProposal(
    @Body() acceptProposalDto: AcceptProposalDto,
    @CurrentUser() userId: string,
  ): Promise<AcceptProposalResponseDto> {
    return this.aiJobsService.acceptProposal(acceptProposalDto, userId);
  }

  /**
   * POST /api/ai/proposal/reject
   * Reject AI proposal and discard
   * PHASE 6: Proposal rejection
   * 
   * Behavior:
   * - Deletes ProposedVersion
   * - Resume remains unchanged
   */
  @Post('proposal/reject')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async rejectProposal(
    @Body() rejectProposalDto: RejectProposalDto,
    @CurrentUser() userId: string,
  ): Promise<RejectProposalResponseDto> {
    return this.aiJobsService.rejectProposal(rejectProposalDto, userId);
  }

  /**
   * POST /api/ai/proposal/refine
   * GOAL 6: Chat-driven iteration
   * 
   * SECURITY: Strict rate limit (5 requests/minute) - expensive AI operation
   * 
   * Refine existing proposal based on user feedback
   * 
   * Behavior:
   * - Takes user feedback as natural language
   * - Uses current proposal as context
   * - Generates new ProposedVersion with refinements
   * - Maintains auditability
   * 
   * Returns new jobId for polling
   */
  @Post('proposal/refine')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async refineProposal(
    @Body() refineDto: { aiJobId: string; feedback: string },
    @CurrentUser() userId: string,
  ): Promise<StartAiTailoringResponseDto> {
    return this.aiJobsService.refineProposal(refineDto.aiJobId, refineDto.feedback, userId);
  }

  /**
   * POST /api/ai/chat
   * Chat mode endpoint for conversational AI assistance
   * 
   * SECURITY: Strict rate limit (10 requests/minute) - AI operation
   * 
   * Provides resume advice, suggestions, and answers without modifying resume.
   * Stateless - frontend manages conversation history.
   * 
   * Context provided:
   * - Resume content (optional)
   * - Job description (optional)
   * - Conversation history (optional)
   */
  @Post('chat')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async chat(
    @Body() chatDto: SendChatDto,
    @CurrentUser() userId: string,
  ): Promise<ChatResponseDto> {
    return this.aiJobsService.chat(chatDto, userId);
  }
}

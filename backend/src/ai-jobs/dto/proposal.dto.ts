import { IsUUID } from 'class-validator';

/**
 * DTO for accepting AI proposal
 * PHASE 6: Proposal acceptance
 */
export class AcceptProposalDto {
  @IsUUID()
  aiJobId: string;

  @IsUUID()
  projectId: string;
}

/**
 * Response DTO for accepting AI proposal
 * PHASE 6: Proposal acceptance
 */
export class AcceptProposalResponseDto {
  newVersionId: string;
}

/**
 * DTO for rejecting AI proposal
 * PHASE 6: Proposal rejection
 */
export class RejectProposalDto {
  @IsUUID()
  aiJobId: string;
}

/**
 * Response DTO for rejecting AI proposal
 * PHASE 6: Proposal rejection
 */
export class RejectProposalResponseDto {
  success: boolean;
}

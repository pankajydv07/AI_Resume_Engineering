import { IsUUID, IsArray, IsOptional } from 'class-validator';
import { SectionType } from '../../versions/dto/section.dto';

/**
 * GOAL 3: Section-level proposal data
 */
export interface SectionProposal {
  sectionType: SectionType;
  before: string;       // Original section content
  after: string;        // AI-modified section content
  changeType: 'modified' | 'unchanged' | 'added' | 'removed';
}

/**
 * DTO for accepting AI proposal
 * PHASE 6: Proposal acceptance
 * GOAL 3: Enhanced with selective section acceptance
 */
export class AcceptProposalDto {
  @IsUUID()
  aiJobId: string;

  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsArray()
  acceptedSections?: SectionType[]; // If provided, accept only these sections
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

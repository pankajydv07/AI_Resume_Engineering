import { IsUUID, IsArray, IsOptional, IsEnum, ArrayMaxSize } from 'class-validator';
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
 * 
 * SECURITY VALIDATION:
 * - All IDs must be valid UUIDs
 * - Accepted sections limited to prevent abuse
 */
export class AcceptProposalDto {
  @IsUUID('4', { message: 'AI job ID must be a valid UUID' })
  aiJobId: string;

  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsOptional()
  @IsArray({ message: 'Accepted sections must be an array' })
  @ArrayMaxSize(20, { message: 'Cannot accept more than 20 sections' })
  @IsEnum(SectionType, { each: true, message: 'Invalid section type' })
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
 * 
 * SECURITY VALIDATION:
 * - AI job ID must be valid UUID
 */
export class RejectProposalDto {
  @IsUUID('4', { message: 'AI job ID must be a valid UUID' })
  aiJobId: string;
}

/**
 * Response DTO for rejecting AI proposal
 * PHASE 6: Proposal rejection
 */
export class RejectProposalResponseDto {
  success: boolean;
}

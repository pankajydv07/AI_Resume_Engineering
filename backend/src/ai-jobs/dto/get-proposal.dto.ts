import { IsUUID } from 'class-validator';
import { SectionProposal } from './proposal.dto';

/**
 * DTO for getting proposal content
 * PHASE 6: Proposal retrieval
 * GOAL 3: Enhanced with section-level proposals
 */
export class GetProposalResponseDto {
  proposedLatexContent: string;      // Full assembled LaTeX (backward compat)
  sectionProposals: SectionProposal[]; // Section-level diffs (GOAL 3)
}

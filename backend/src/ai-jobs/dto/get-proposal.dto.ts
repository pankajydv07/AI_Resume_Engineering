import { IsUUID } from 'class-validator';

/**
 * DTO for getting proposal content
 * PHASE 6: Proposal retrieval
 */
export class GetProposalResponseDto {
  proposedLatexContent: string;
}

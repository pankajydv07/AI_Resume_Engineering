import { IsString, IsUUID } from 'class-validator';

/**
 * DTO for submitting a job description
 * From apis.md Section 5.1
 */
export class SubmitJdDto {
  @IsUUID()
  projectId: string;

  @IsString()
  rawText: string;
}

/**
 * Response DTO for submitting JD
 * From apis.md Section 5.1
 */
export class SubmitJdResponseDto {
  jdId: string;
}

/**
 * Response DTO for getting a job description
 * From apis.md Section 5.2
 * 
 * PHASE 4: Returns rawText only (no AI fields)
 */
export class JobDescriptionDto {
  jdId: string;
  projectId: string;
  rawText: string;
  createdAt: string;
}

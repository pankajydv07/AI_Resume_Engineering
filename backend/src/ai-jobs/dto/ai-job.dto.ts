import { IsUUID, IsEnum, IsArray, IsOptional } from 'class-validator';

/**
 * DTO for starting AI tailoring job
 * From apis.md Section 6.1
 */
export class StartAiTailoringDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  baseVersionId: string;

  @IsUUID()
  jdId: string;

  @IsEnum(['MINIMAL', 'BALANCED', 'AGGRESSIVE'])
  mode: 'MINIMAL' | 'BALANCED' | 'AGGRESSIVE';

  @IsArray()
  @IsOptional()
  lockedSections?: string[];
}

/**
 * Response DTO for starting AI tailoring job
 * From apis.md Section 6.1
 */
export class StartAiTailoringResponseDto {
  jobId: string;
}

/**
 * Response DTO for getting AI job status
 * From apis.md Section 6.2
 */
export class AiJobStatusDto {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  newVersionId: string | null;
  errorMessage: string | null;
}

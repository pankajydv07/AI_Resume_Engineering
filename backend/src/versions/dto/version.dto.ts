import { IsString } from 'class-validator';

/**
 * Response DTO for getting a resume version
 * From apis.md Section 4.1
 */
export class ResumeVersionDto {
  versionId: string;
  projectId: string;
  type: 'BASE' | 'MANUAL' | 'AI_GENERATED';
  status: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE';
  latexContent: string;
  pdfUrl: string | null;
  createdAt: string;
}

/**
 * DTO for saving manual resume edit
 * From apis.md Section 4.2
 */
export class SaveResumeEditDto {
  @IsString()
  latexContent: string;
}

/**
 * Response DTO for saving manual edit
 * From apis.md Section 4.2
 */
export class SaveResumeEditResponseDto {
  newVersionId: string;
}

/**
 * Response DTO for compiling a resume version
 * From apis.md Section 4.3
 */
export class CompileResumeResponseDto {
  status: 'success' | 'error';
  errors: string[];
}

/**
 * Response DTO for version diff
 * From apis.md Section 7.1
 */
export class VersionDiffDto {
  added: string[];
  removed: string[];
  rewritten: Array<{ before: string; after: string }>;
}

/**
 * DTO for listing versions (compact version without latexContent)
 * From apis.md Section 4.4
 */
export class VersionListItemDto {
  versionId: string;
  projectId: string;
  type: 'BASE' | 'MANUAL' | 'AI_GENERATED';
  status: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE';
  createdAt: string;
  parentVersionId: string | null;
}

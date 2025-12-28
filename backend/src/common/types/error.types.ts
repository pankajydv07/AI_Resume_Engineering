/**
 * Global error response format
 * From apis.md Section 9
 * 
 * All error responses must follow this format
 */
export interface ErrorResponse {
  error: string;       // ERROR_CODE
  message: string;     // Human readable message
}

/**
 * Common error codes
 * 
 * TODO: Expand as needed
 * TODO: Add specific error codes for each operation
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  AI_JOB_FAILED = 'AI_JOB_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

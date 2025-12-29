/**
 * PHASE 7.3: Standardized Error Handling
 * 
 * Centralized error handling for consistent user-facing messages
 * Maps HTTP status codes and network errors to actionable messages
 * 
 * Usage:
 *   try {
 *     const response = await fetch(...);
 *     if (!response.ok) {
 *       throw await handleHttpError(response);
 *     }
 *   } catch (err) {
 *     setError(getErrorMessage(err));
 *   }
 */

export interface ErrorInfo {
  message: string;
  isRetryable: boolean;
  statusCode?: number;
}

/**
 * Handle HTTP response errors with standardized messages
 */
export async function handleHttpError(response: Response): Promise<ErrorInfo> {
  const statusCode = response.status;
  
  // Try to get error details from response body
  let serverMessage = '';
  try {
    const data = await response.json();
    serverMessage = data.message || data.error || '';
  } catch {
    // Ignore JSON parse errors
  }

  switch (statusCode) {
    case 401:
      return {
        message: 'Not authorized. Please sign in again.',
        isRetryable: false,
        statusCode: 401,
      };
    
    case 403:
      return {
        message: 'Not authorized. You do not have permission to access this resource.',
        isRetryable: false,
        statusCode: 403,
      };
    
    case 404:
      return {
        message: serverMessage || 'Not found. The requested resource does not exist.',
        isRetryable: false,
        statusCode: 404,
      };
    
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: 'Server error. Please try again later.',
        isRetryable: true,
        statusCode,
      };
    
    default:
      return {
        message: serverMessage || `Request failed with status ${statusCode}`,
        isRetryable: statusCode >= 500,
        statusCode,
      };
  }
}

/**
 * Get user-facing error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('isRetryable' in error) {
      return Boolean(error.isRetryable);
    }
    if ('statusCode' in error) {
      const statusCode = Number(error.statusCode);
      return statusCode >= 500;
    }
  }
  
  // Network errors are retryable
  const message = getErrorMessage(error);
  return message.includes('Network error') || message.includes('try again');
}

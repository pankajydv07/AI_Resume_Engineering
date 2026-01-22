/**
 * Input Sanitization Utilities
 * 
 * SECURITY: OWASP-compliant input sanitization
 * 
 * These utilities help prevent:
 * - XSS attacks (cross-site scripting)
 * - SQL injection (when used with ORMs)
 * - Path traversal attacks
 * - Command injection
 * 
 * Note: These are complementary to class-validator decorators.
 * Always use both validation (DTO) + sanitization (runtime).
 */

/**
 * Remove or escape potentially dangerous HTML characters
 * Prevents XSS in strings that might be rendered
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strip all HTML tags from input
 * Use when no HTML should be present
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize string for safe logging
 * Prevents log injection attacks
 */
export function sanitizeForLogging(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[\r\n]/g, ' ') // Remove newlines (log injection)
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, 1000); // Limit length for log safety
}

/**
 * Sanitize filename to prevent path traversal
 * Use for any user-provided filenames
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[\/\\:*?"<>|]/g, '') // Remove invalid filename chars
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit filename length
}

/**
 * Normalize and validate URL for safe redirect
 * Prevents open redirect vulnerabilities
 */
export function sanitizeUrl(input: string, allowedHosts: string[] = []): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  try {
    const url = new URL(input);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    
    // If allowedHosts is specified, validate hostname
    if (allowedHosts.length > 0 && !allowedHosts.includes(url.hostname)) {
      return null;
    }
    
    return url.toString();
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Truncate string to maximum length
 * Prevents buffer overflow and DoS via large inputs
 */
export function truncateString(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  if (input.length <= maxLength) {
    return input;
  }
  
  return input.substring(0, maxLength);
}

/**
 * Remove null bytes and control characters
 * Prevents null byte injection attacks
 */
export function stripNullBytes(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/\x00/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

/**
 * Validate and sanitize UUID format
 * Returns null if invalid
 */
export function sanitizeUuid(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  // Standard UUID regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  const trimmed = input.trim().toLowerCase();
  
  if (uuidRegex.test(trimmed)) {
    return trimmed;
  }
  
  return null;
}

/**
 * Sanitize email address
 * Basic sanitization, use with proper email validation
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .substring(0, 254); // RFC 5321 max length
}

/**
 * Create a safe string for database queries
 * Note: Always use parameterized queries with Prisma, this is additional defense
 */
export function sanitizeForDatabase(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return stripNullBytes(input).replace(/[\x00]/g, '');
}

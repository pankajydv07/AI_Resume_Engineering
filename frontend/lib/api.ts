/**
 * API Configuration
 * 
 * Central configuration for backend API calls.
 * Uses environment variable for backend URL to support different environments:
 * - Development: http://localhost:3001
 * - Docker: http://backend:3001
 * - Production: https://api.yourapp.com
 * 
 * Usage:
 * ```ts
 * import { API_BASE_URL } from '@/lib/api';
 * 
 * const response = await fetch(`${API_BASE_URL}/api/projects`, {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 * ```
 */

/**
 * Backend API base URL
 * - Production (Vercel): Uses proxy, so empty string
 * - Development: Falls back to localhost
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

/**
 * Helper function to build API URLs
 * Ensures consistent URL construction
 * 
 * @param path - API path starting with /api/...
 * @returns Complete URL
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If no base URL (production with proxy), return path only
  if (!API_BASE_URL) {
    return cleanPath;
  }
  
  // Remove trailing slash from base URL if present
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  return `${baseUrl}${cleanPath}`;
}

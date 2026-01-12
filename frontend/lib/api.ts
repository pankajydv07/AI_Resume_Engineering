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
 * Falls back to localhost if env variable not set (development default)
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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
  
  // Remove trailing slash from base URL if present
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  return `${baseUrl}${cleanPath}`;
}

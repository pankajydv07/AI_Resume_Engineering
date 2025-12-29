import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk Middleware for Route Protection
 * 
 * Purpose:
 * - Protect /dashboard and /projects routes (requires authentication)
 * - Allow public access to /, /sign-in, /sign-up
 * 
 * From userflow.md:
 * - Authentication handled by Clerk
 * - After successful auth, redirect to /dashboard (configured in .env.local)
 * 
 * PHASE 7.1: Added /projects route protection
 */

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/projects(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

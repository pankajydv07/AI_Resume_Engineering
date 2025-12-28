import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk Middleware for Route Protection
 * 
 * Purpose:
 * - Protect /dashboard route (requires authentication)
 * - Allow public access to /, /sign-in, /sign-up
 * 
 * From userflow.md:
 * - Authentication handled by Clerk
 * - After successful auth, redirect to /dashboard (configured in .env.local)
 */

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  // TODO: Add future protected routes here:
  // '/projects(.*)',
  // '/editor(.*)',
  // '/review(.*)',
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

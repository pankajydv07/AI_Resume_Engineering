import { SignIn } from "@clerk/nextjs";

/**
 * Sign In Page (/sign-in)
 * 
 * Handled by: Clerk
 * 
 * Purpose (from userflow.md):
 * - User authentication only
 * 
 * After Success:
 * - Redirect to /dashboard (configured in .env.local)
 * 
 * Note: No custom logic allowed here
 */
export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn />
    </main>
  );
}

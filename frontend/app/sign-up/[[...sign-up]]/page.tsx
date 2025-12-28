import { SignUp } from "@clerk/nextjs";

/**
 * Sign Up Page (/sign-up)
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
export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp />
    </main>
  );
}

import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Landing Page (/)
 * 
 * Purpose (from userflow.md):
 * - Explain value proposition
 * - Push user to sign up
 * 
 * Allowed Actions:
 * - Navigate to Sign Up
 * - Navigate to Sign In
 * - Navigate to Dashboard (if signed in)
 * 
 * Disallowed:
 * - No editing
 * - No AI actions
 */
export default async function Home() {
  const user = await currentUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          JD-Aware Resume Engineering
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Generate job-description-specific resume versions while preserving LaTeX safety, version control, and complete auditability.
        </p>
        <div className="flex gap-4 justify-center">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
              <Link
                href="/sign-in"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

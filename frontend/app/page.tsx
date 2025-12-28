import Link from "next/link";

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
 * 
 * Disallowed:
 * - No editing
 * - No AI actions
 * - No dashboard access
 */
export default function Home() {
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
        </div>
      </div>
    </main>
  );
}

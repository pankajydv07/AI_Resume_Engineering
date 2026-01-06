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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      
      {/* Animated orbs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 left-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 right-40 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      {/* Floating elements for visual interest */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
      <div className="absolute top-3/4 left-1/3 w-3 h-3 bg-teal-400 rounded-full animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse animation-delay-4000"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-4">
        {/* Header text */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            Start Your Journey
          </h1>
          <p className="text-gray-600 text-lg">
            Create an account and build AI-powered resumes
          </p>
        </div>
        
        {/* Clerk sign-up with enhanced container */}
        <div className="backdrop-blur-xl bg-white/90 p-8 rounded-3xl shadow-2xl border border-white/40 w-full">
          <SignUp />
        </div>
        
        {/* Footer text */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/sign-in" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Sign in instead
          </a>
        </p>
      </div>
    </main>
  );
}

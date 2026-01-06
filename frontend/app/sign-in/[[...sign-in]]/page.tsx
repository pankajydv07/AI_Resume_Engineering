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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      
      {/* Animated orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      {/* Floating elements for visual interest */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
      <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-purple-400 rounded-full animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-4000"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-4">
        {/* Header text */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">
            Sign in to continue crafting your perfect resume
          </p>
        </div>
        
        {/* Clerk sign-in with enhanced container */}
        <div className="backdrop-blur-xl bg-white/90 p-8 rounded-3xl shadow-2xl border border-white/40 w-full">
          <SignIn />
        </div>
        
        {/* Footer text */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Sign up for free
          </a>
        </p>
      </div>
    </main>
  );
}

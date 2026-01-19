import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-4">
        {/* Header text */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-lg">
            Sign in to continue crafting your perfect resume
          </p>
        </div>
        
        {/* Clerk sign-in with enhanced container */}
        <div className="backdrop-blur-xl bg-gray-900/50 p-8 rounded-2xl border border-white/10 w-full">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
                card: "bg-transparent shadow-none",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white",
                formFieldLabel: "text-gray-300",
                formFieldInput: "bg-white/5 border-white/10 text-white",
                footerActionLink: "text-blue-400 hover:text-blue-300",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-blue-400",
              }
            }}
          />
        </div>
        
        {/* Footer text */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}

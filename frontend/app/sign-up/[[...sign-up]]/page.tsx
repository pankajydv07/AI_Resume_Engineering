import { SignUp } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-4">
        {/* Header text */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Start Your Journey
          </h1>
          <p className="text-gray-400 text-lg">
            Create an account and build AI-powered resumes
          </p>
        </div>
        
        {/* Clerk sign-up component */}
        <SignUp 
          appearance={{
            variables: {
              colorPrimary: '#a855f7',
              colorBackground: '#111827',
              colorInputBackground: 'rgba(255, 255, 255, 0.05)',
              colorInputText: '#ffffff',
              colorText: '#ffffff',
              colorTextSecondary: '#9ca3af',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'backdrop-blur-xl bg-gray-900/50 border border-white/10 shadow-2xl',
              headerTitle: 'text-white text-2xl font-bold',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all',
              socialButtonsBlockButtonText: 'text-white font-medium',
              formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium shadow-lg shadow-purple-500/25 transition-all',
              formFieldLabel: 'text-gray-300 font-medium',
              formFieldInput: 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
              footerActionLink: 'text-purple-400 hover:text-purple-300 font-medium',
              footerActionText: 'text-gray-500',
              dividerLine: 'bg-white/10',
              dividerText: 'text-gray-500',
              formFieldInputShowPasswordButton: 'text-gray-400 hover:text-gray-300',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-purple-400 hover:text-purple-300',
            }
          }}
        />
      </div>
    </main>
  );
}

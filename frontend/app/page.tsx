import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { Stats } from "./components/Stats";
import { CTA } from "./components/CTA";

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
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Spacer for floating navbar */}
      <div className="h-20" />
      
      <Hero isAuthenticated={!!user} />
      <HowItWorks />
      <Features />
      <Stats />
      <CTA isAuthenticated={!!user} />
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2026 AI Resume Engineering. Built with 💜 for job seekers.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

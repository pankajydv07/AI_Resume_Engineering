import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { Stats } from "./components/Stats";
import { CTA } from "./components/CTA";
import { Navbar } from "./components/Navbar";

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
    <main className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <Navbar isAuthenticated={!!user} />
      <Hero isAuthenticated={!!user} />
      <HowItWorks />
      <Features />
      <Stats />
      <CTA isAuthenticated={!!user} />
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-dark-400">
            <p>&copy; 2026 AI Resume Engineering. Built with 💜 for job seekers.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

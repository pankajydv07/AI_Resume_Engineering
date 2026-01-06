'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SlideUp } from '@/components/ui/Animated';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  isAuthenticated: boolean;
}

export function Hero({ isAuthenticated }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <SlideUp>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 group hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-dark-300">AI-Powered Resume Engineering</span>
            </div>
          </SlideUp>

          <SlideUp delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Land Your Dream Job with{' '}
              <span className="text-gradient">AI-Tailored</span> Resumes
            </h1>
          </SlideUp>

          <SlideUp delay={0.2}>
            <p className="text-xl sm:text-2xl text-dark-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Generate job-specific resume versions with AI precision. 
              Built-in LaTeX editor, version control, and complete transparency.
            </p>
          </SlideUp>

          <SlideUp delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="primary" size="lg" className="group">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-up">
                    <Button variant="primary" size="lg" className="group">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button variant="secondary" size="lg">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </SlideUp>

          {/* Floating Resume Preview Cards */}
          <SlideUp delay={0.4}>
            <div className="mt-20 relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass-card p-6 hover:scale-105 transition-transform animate-float"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <div className="w-full h-48 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-4xl">📄</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SlideUp>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AnimatedSection } from '@/components/ui/Animated';
import { ArrowRight } from 'lucide-react';

interface CTAProps {
  isAuthenticated: boolean;
}

export function CTA({ isAuthenticated }: CTAProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="glass-card p-12 text-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 animate-glow" />
            
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Ready to Land Your <span className="text-gradient">Dream Job?</span>
              </h2>
              <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
                Join thousands of job seekers using AI to get more interviews and better opportunities.
              </p>
              
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="primary" size="lg" className="group">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/sign-up">
                    <Button variant="primary" size="lg" className="group">
                      Start Free Today
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <div className="text-dark-400 text-sm">No credit card required</div>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

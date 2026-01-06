'use client';

import { AnimatedSection } from '@/components/ui/Animated';
import { Sparkles, GitBranch, FileCode, Diff, Eye, Zap } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Optimization',
      description: 'Advanced AI analyzes job descriptions and tailors your resume with precision, improving ATS scores.',
      gradient: 'from-primary-500 to-secondary-500',
      large: true,
    },
    {
      icon: GitBranch,
      title: 'Version Control',
      description: 'Track every change with git-like version history. Never lose your work.',
      gradient: 'from-secondary-500 to-pink-500',
    },
    {
      icon: FileCode,
      title: 'LaTeX Editor',
      description: 'Professional LaTeX editor with syntax highlighting and live preview.',
      gradient: 'from-accent-500 to-cyan-500',
    },
    {
      icon: Diff,
      title: 'Smart Diff Viewer',
      description: 'Review AI changes section-by-section with detailed explanations.',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: Eye,
      title: 'Live PDF Preview',
      description: 'See your changes instantly with real-time PDF rendering.',
      gradient: 'from-cyan-500 to-blue-500',
      large: true,
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance for instant compilation and AI responses.',
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Powerful <span className="text-gradient">Features</span>
            </h2>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto">
              Everything you need to create the perfect resume
            </p>
          </div>
        </AnimatedSection>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <AnimatedSection
                key={index}
                delay={index * 0.05}
              >
                <div
                  className={`glass-card h-full group hover:scale-[1.02] transition-all duration-300 ${
                    feature.large ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-dark-300 leading-relaxed">{feature.description}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

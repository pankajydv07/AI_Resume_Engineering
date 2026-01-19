'use client';

import { motion } from 'framer-motion';
import { Sparkles, GitBranch, FileCode, Diff, Eye, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Features() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Optimization',
      description: 'Advanced AI analyzes job descriptions and tailors your resume with precision, improving ATS scores.',
      gradient: 'from-blue-500 to-indigo-600',
      large: true,
    },
    {
      icon: GitBranch,
      title: 'Version Control',
      description: 'Track every change with git-like version history. Never lose your work.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: FileCode,
      title: 'LaTeX Editor',
      description: 'Professional LaTeX editor with syntax highlighting and live preview.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Diff,
      title: 'Smart Diff Viewer',
      description: 'Review AI changes section-by-section with detailed explanations.',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: Eye,
      title: 'Live PDF Preview',
      description: 'See your changes instantly with real-time PDF rendering.',
      gradient: 'from-cyan-500 to-blue-600',
      large: true,
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance for instant compilation and AI responses.',
      gradient: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            Powerful <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Features</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to create the perfect resume
          </p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all group",
                  feature.large && "md:col-span-2"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
                  feature.gradient
                )}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

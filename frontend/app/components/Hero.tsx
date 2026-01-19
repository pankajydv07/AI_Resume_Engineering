'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  isAuthenticated: boolean;
}

export function Hero({ isAuthenticated }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 hover:bg-white/10 transition-colors">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">AI-Powered Resume Engineering</span>
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white"
          >
            Land Your Dream Job with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">AI-Tailored</span> Resumes
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Generate job-specific resume versions with AI precision. 
            Built-in LaTeX editor, version control, and complete transparency.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isAuthenticated ? (
              <Link href="/dashboard">
                <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-lg hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-lg hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/sign-in">
                  <button className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 transition-all">
                    Sign In
                  </button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Floating Resume Preview Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl mb-4 flex items-center justify-center">
                    <div className="text-4xl">📄</div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

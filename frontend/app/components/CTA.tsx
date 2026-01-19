'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CTAProps {
  isAuthenticated: boolean;
}

export function CTA({ isAuthenticated }: CTAProps) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-3xl bg-gray-900/50 backdrop-blur-sm border border-white/10 text-center relative overflow-hidden"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10" />
          
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              Ready to Land Your <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Dream Job?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers using AI to get more interviews and better opportunities.
            </p>
            
            {isAuthenticated ? (
              <Link href="/dashboard">
                <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-lg hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/sign-up">
                  <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-lg hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25">
                    Start Free Today
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <div className="text-gray-500 text-sm">No credit card required</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

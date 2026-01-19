'use client';

import { motion } from 'framer-motion';
import { Upload, Wand2, Rocket } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Your Resume',
      description: 'Start with your base LaTeX resume or create one from scratch with our editor.',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Wand2,
      title: 'AI Tailors It',
      description: 'Our AI analyzes job descriptions and optimizes your resume for each application.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: Rocket,
      title: 'Get Hired',
      description: 'Download perfectly tailored resumes and land more interviews.',
      gradient: 'from-emerald-500 to-teal-600',
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
            How It <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Three simple steps to transform your job search
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all group"
              >
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

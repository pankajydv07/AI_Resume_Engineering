'use client';

import { AnimatedSection } from '@/components/ui/Animated';
import { Upload, Wand2, Rocket } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Your Resume',
      description: 'Start with your base LaTeX resume or create one from scratch with our editor.',
      color: 'primary',
    },
    {
      icon: Wand2,
      title: 'AI Tailors It',
      description: 'Our AI analyzes job descriptions and optimizes your resume for each application.',
      color: 'secondary',
    },
    {
      icon: Rocket,
      title: 'Get Hired',
      description: 'Download perfectly tailored resumes and land more interviews.',
      color: 'accent',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto">
              Three simple steps to transform your job search
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="glass-card relative group">
                  {/* Step number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-glow">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-dark-300 leading-relaxed">{step.description}</p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

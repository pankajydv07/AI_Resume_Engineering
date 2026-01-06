'use client';

import { AnimatedSection } from '@/components/ui/Animated';
import { Users, TrendingUp, Target, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Stats() {
  const stats = [
    { icon: Users, value: 10000, suffix: '+', label: 'Active Users' },
    { icon: TrendingUp, value: 95, suffix: '%', label: 'Success Rate' },
    { icon: Target, value: 2.5, suffix: 'x', label: 'More Interviews' },
    { icon: Clock, value: 24, suffix: '/7', label: 'AI Support' },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Trusted by Job Seekers <span className="text-gradient">Worldwide</span>
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="glass-card text-center group hover:scale-105 transition-transform">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:animate-glow">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-gradient mb-2">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-dark-300">{stat.label}</div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
}

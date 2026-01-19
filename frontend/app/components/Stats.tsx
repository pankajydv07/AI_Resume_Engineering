'use client';

import { motion } from 'framer-motion';
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            Trusted by Job Seekers <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Worldwide</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
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

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function GlassCard({ children, hover = true, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card p-6',
        hover && 'transition-all duration-300 hover:scale-[1.02] hover:shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

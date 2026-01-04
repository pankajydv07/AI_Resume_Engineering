'use client';

import React from 'react';

/**
 * Background Process Indicator
 * 
 * Non-blocking indicator that shows ongoing background processes.
 * Appears in the header or corner without blocking UI interaction.
 * 
 * Features:
 * - Compact design
 * - Animated spinner
 * - Optional progress percentage
 * - Clickable to show details
 */

export interface BackgroundProcess {
  id: string;
  label: string;
  status: 'running' | 'completed' | 'failed';
  progress?: number; // 0-100
}

interface ProcessIndicatorProps {
  processes: BackgroundProcess[];
  onProcessClick?: (processId: string) => void;
  className?: string;
}

export function ProcessIndicator({ processes, onProcessClick, className = '' }: ProcessIndicatorProps) {
  const activeProcesses = processes.filter(p => p.status === 'running');
  
  if (activeProcesses.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {activeProcesses.map(process => (
        <button
          key={process.id}
          onClick={() => onProcessClick?.(process.id)}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded-full text-xs font-medium text-zinc-200 hover:bg-zinc-700/80 transition-all"
        >
          {/* Spinner */}
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          
          {/* Label */}
          <span className="max-w-[120px] truncate">{process.label}</span>
          
          {/* Progress */}
          {process.progress !== undefined && (
            <span className="text-zinc-400">{process.progress}%</span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Inline Loading Indicator
 * 
 * Subtle loading indicator for inline operations.
 * Use instead of blocking overlays for quick operations.
 */
interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function InlineLoading({ size = 'md', label, className = '' }: InlineLoadingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3 border',
    md: 'w-4 h-4 border-2',
    lg: 'w-5 h-5 border-2',
  }[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`${sizeClasses} border-current border-t-transparent rounded-full animate-spin`} />
      {label && <span className="text-sm text-zinc-400">{label}</span>}
    </span>
  );
}

/**
 * Button with Loading State
 * 
 * Button that shows loading state without blocking interaction with other elements.
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  isLoading, 
  loadingText, 
  children, 
  disabled, 
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`relative ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Skeleton Loading Placeholder
 * 
 * Shows content placeholder while loading.
 * Better UX than spinners for content that has predictable shape.
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  }[variant];

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div 
      className={`animate-pulse bg-zinc-700/50 ${variantClasses} ${className}`}
      style={style}
    />
  );
}

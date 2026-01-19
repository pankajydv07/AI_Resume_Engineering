'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle } from 'lucide-react';

/**
 * REFACTORED LATEX EDITOR
 * 
 * Clean, minimal design with:
 * - No header (cleaner look)
 * - Subtle unsaved indicator
 * - Monaco Editor for code editing
 */

// SSR-safe Monaco import
const MonacoLatexEditor = dynamic(
  () => import('./MonacoLatexEditor').then((mod) => ({ default: mod.MonacoLatexEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
          <span className="text-sm">Loading editor...</span>
        </div>
      </div>
    ),
  }
);

interface LaTeXEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  isDirty: boolean;
  isLoading: boolean;
}

export function LaTeXEditor({ value, onChange, isDirty, isLoading }: LaTeXEditorProps) {
  return (
    <div className="h-full flex flex-col relative">
      {/* Editor */}
      <div className="flex-1 relative">
        <MonacoLatexEditor
          value={value}
          onChange={onChange}
          disabled={isLoading}
          className="absolute inset-0"
        />
      </div>

      {/* Unsaved changes indicator - floating */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 z-10"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm">
              <Circle className="w-2 h-2 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="text-xs text-amber-300 font-medium">Unsaved</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/80 border border-white/10">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-300">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

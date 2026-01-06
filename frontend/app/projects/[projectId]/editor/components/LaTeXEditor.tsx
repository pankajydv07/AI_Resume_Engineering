'use client';

import dynamic from 'next/dynamic';

/**
 * PHASE 3: LaTeX Editor Component
 * 
 * Per requirements:
 * - Editing updates latexDraft only (in-memory)
 * - Sets isDirty flag when content changes
 * - No autosave
 * - No direct DB assumptions
 * 
 * ENHANCEMENT: Monaco Editor for improved editing experience
 * - Drop-in replacement for textarea
 * - Same value/onChange contract
 * - No changes to state management or logic
 */

// SSR-safe Monaco import
const MonacoLatexEditor = dynamic(
  () => import('./MonacoLatexEditor').then((mod) => ({ default: mod.MonacoLatexEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        Loading editor...
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
    <div className="flex flex-col h-full bg-gradient-to-br from-dark-950 via-dark-900/50 to-dark-950">
      {/* PHASE 7.2: Section Header with Helper Text */}
      <div className="glass border-b border-white/5 px-6 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">LaTeX Editor</h2>
              <p className="text-xs text-dark-400 mt-0.5">
                Edit your resume code with syntax highlighting
              </p>
            </div>
          </div>
          {isDirty && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
              <span className="text-xs text-orange-300 font-medium">
                Unsaved Changes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content with subtle border */}
      <div className="flex-1 relative border-t border-white/5">
        <MonacoLatexEditor
          value={value}
          onChange={onChange}
          disabled={isLoading}
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}

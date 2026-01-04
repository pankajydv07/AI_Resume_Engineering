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
    <div className="flex flex-col h-full bg-zinc-900/40 backdrop-blur-sm">
      {/* PHASE 7.2: Section Header with Helper Text */}
      <div className="bg-zinc-900/60 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-zinc-200">Resume Editor</h2>
          {isDirty && (
            <span className="text-xs text-orange-400 font-medium">
              • Unsaved Changes
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400">
          Edit your resume LaTeX code. Changes are saved manually as new versions.
        </p>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
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

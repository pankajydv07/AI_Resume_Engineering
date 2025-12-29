'use client';

import { ChangeEvent } from 'react';

/**
 * PHASE 3: LaTeX Editor Component
 * 
 * Per requirements:
 * - Editing updates latexDraft only (in-memory)
 * - Sets isDirty flag when content changes
 * - No autosave
 * - No direct DB assumptions
 */

interface LaTeXEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  isDirty: boolean;
  isLoading: boolean;
}

export function LaTeXEditor({ value, onChange, isDirty, isLoading }: LaTeXEditorProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">LaTeX Editor</h2>
          {isDirty && (
            <span className="text-xs text-orange-600 font-medium">
              • Unsaved Changes
            </span>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={handleChange}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="LaTeX content will appear here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}

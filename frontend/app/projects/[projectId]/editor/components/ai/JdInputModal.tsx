'use client';

import { useState, useEffect } from 'react';

/**
 * JD INPUT MODAL
 * 
 * Modal for adding/editing job description context.
 * Used by both Chat and Edit modes.
 * 
 * Features:
 * - Paste JD text directly
 * - Edit existing JD
 * - Remove JD
 * 
 * Note: This is a local-only implementation for MVP.
 * Future: Could integrate with existing JD service (/api/jd)
 */

interface JdInputModalProps {
  currentJd: string | null;
  onSave: (jd: string) => void;
  onClose: () => void;
}

export function JdInputModal({ currentJd, onSave, onClose }: JdInputModalProps) {
  const [jdText, setJdText] = useState(currentJd || '');

  useEffect(() => {
    setJdText(currentJd || '');
  }, [currentJd]);

  const handleSave = () => {
    if (jdText.trim()) {
      onSave(jdText.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">
            {currentJd ? 'Edit Job Description' : 'Add Job Description'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Description
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job description here...&#10;&#10;Example:&#10;We are looking for a Senior Backend Engineer with 5+ years of experience..."
              className="w-full h-64 px-4 py-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none outline-none"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              This will provide context for both Chat and Edit modes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!jdText.trim()}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

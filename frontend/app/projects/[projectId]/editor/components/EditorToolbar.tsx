'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * PHASE 3: Editor Toolbar Component
 * 
 * PHASE 7.1: Added navigation back to project
 * 
 * Per requirements:
 * - Save button calls PUT /api/versions/{versionId}
 * - Creates new MANUAL version
 * - Show minimal success feedback
 * - No autosave
 * 
 * Per userflow.md Section 2.5:
 * - Allowed actions: Save manual changes, Compile resume
 * - Forbidden: AI auto-running, silent overwrites
 */

interface EditorToolbarProps {
  isDirty: boolean;
  isLoading: boolean;
  onSave: () => Promise<void>;
  currentVersionId: string | null;
  projectId: string;
  onSaveSuccess?: () => void;
}

export function EditorToolbar({
  isDirty,
  isLoading,
  onSave,
  currentVersionId,
  projectId,
  onSaveSuccess,
}: EditorToolbarProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    try {
      await onSave();
      
      // Show minimal success feedback
      setShowSuccess(true);
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save changes. Please try again.');
    }
  };

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Back to Project Link */}
        <Link
          href={`/projects/${projectId}`}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          ← Back
        </Link>
        
        <h1 className="text-lg font-semibold text-gray-900">Resume Editor</h1>
        
        {currentVersionId && (
          <span className="text-xs text-gray-500 font-mono">
            v{currentVersionId.substring(0, 8)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Success Feedback - Minimal Toast */}
        {showSuccess && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Saved
          </div>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isLoading || !currentVersionId}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Compile Button - Placeholder for future phase */}
        <button
          type="button"
          disabled
          className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded cursor-not-allowed"
          title="Compile functionality pending (future phase)"
        >
          Compile
        </button>

        {/* JD Tailoring Button - Forbidden in this phase */}
        {/* Per requirements: No AI UI, No JD UI */}
      </div>
    </div>
  );
}

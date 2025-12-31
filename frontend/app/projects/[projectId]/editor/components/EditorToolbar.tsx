import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

/**
 * PHASE 3: Editor Toolbar Component
 * 
 * PHASE 7.1: Added navigation back to project
 * PHASE 8: Added Compile button with full functionality
 * PHASE 8: Added Download PDF and Download LaTeX buttons
 * 
 * Per requirements:
 * - Save button calls PUT /api/versions/{versionId}
 * - Creates new MANUAL version
 * - Show minimal success feedback
 * - No autosave
 * - Download PDF (enabled only if status === COMPILED)
 * - Download LaTeX (always enabled)
 * 
 * Per userflow.md Section 2.5:
 * - Allowed actions: Save manual changes, Compile resume
 * - Forbidden: AI auto-running, silent overwrites
 */

interface EditorToolbarProps {
  isDirty: boolean;
  isLoading: boolean;
  onSave: () => Promise<void>;
  onCompile?: () => Promise<void>;
  currentVersionId: string | null;
  projectId: string;
  currentVersionStatus?: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE' | null;
  getToken: () => Promise<string | null>;
  onSaveSuccess?: () => void;
}

export function EditorToolbar({
  isDirty,
  isLoading,
  onSave,
  onCompile,
  currentVersionId,
  projectId,
  currentVersionStatus,
  getToken,
  onSaveSuccess,
}: EditorToolbarProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleCompile = async () => {
    if (!onCompile) return;
    
    setIsCompiling(true);
    try {
      await onCompile();
      // Success feedback handled by parent component
    } catch (err) {
      console.error('Compilation failed:', err);
      // Error is already in editor state, no need to alert
    } finally {
      setIsCompiling(false);
    }
  };

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleDownloadPdf = async () => {
    if (!currentVersionId) return;
    
    setIsDownloading(true);
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl(`/api/versions/${currentVersionId}/download/pdf`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const result = await response.json();
      
      // Open Cloudinary URL in new tab to download
      window.open(result.url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download PDF. Please ensure the version is compiled.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadLatex = async () => {
    if (!currentVersionId) return;
    
    setIsDownloading(true);
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl(`/api/versions/${currentVersionId}/download/latex`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download LaTeX');
      }

      // Response is already a text file with proper headers
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${currentVersionId.substring(0, 8)}.tex`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download LaTeX file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

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

        {/* Compile Button - PHASE 8: Full implementation */}
        <button
          type="button"
          onClick={handleCompile}
          disabled={!currentVersionId || isCompiling || isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          title="Compile LaTeX to PDF"
        >
          {isCompiling ? 'Compiling...' : 'Compile PDF'}
        </button>

        {/* Download PDF Button - Only enabled if COMPILED */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={!currentVersionId || currentVersionStatus !== 'COMPILED' || isDownloading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          title={currentVersionStatus === 'COMPILED' ? 'Download compiled PDF' : 'Compile resume first to download PDF'}
        >
          {isDownloading ? '↓...' : '↓ PDF'}
        </button>

        {/* Download LaTeX Button - Always enabled */}
        <button
          type="button"
          onClick={handleDownloadLatex}
          disabled={!currentVersionId || isDownloading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          title="Download LaTeX source code"
        >
          {isDownloading ? '↓...' : '↓ LaTeX'}
        </button>
      </div>
    </div>
  );
}

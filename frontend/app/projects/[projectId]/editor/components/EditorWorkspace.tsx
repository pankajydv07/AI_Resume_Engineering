'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditorState } from '../hooks/useEditorState';
import { EditorToolbar } from './EditorToolbar';
import { VersionSelector } from './VersionSelector';
import { LaTeXEditor } from './LaTeXEditor';
import { PDFPreview } from './PDFPreview';
import { JdPanel } from './jd/JdPanel';

/**
 * PHASE 3: Main Editor Workspace Component
 * 
 * Per userflow.md Section 2.5:
 * - Layout: LEFT (LaTeX Editor) | RIGHT (PDF Preview)
 * - Manages editor state via useEditorState hook
 * - Handles version switching, saving, and editing
 * 
 * State Management:
 * - currentVersionId: UUID of loaded version
 * - latexDraft: In-memory edited content
 * - isDirty: True when latexDraft differs from saved version
 */

interface EditorWorkspaceProps {
  projectId: string;
  initialVersionId?: string | null;
}

export function EditorWorkspace({ projectId, initialVersionId }: EditorWorkspaceProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentVersionId,
    latexDraft,
    isDirty,
    isLoading,
    error,
    currentVersion,
    loadVersion,
    loadLatestVersion,
    updateDraft,
    switchVersion,
    saveEdit,
    compileVersion,
  } = useEditorState(projectId, getToken);

  // PHASE 4: JD Panel visibility state (completely separate from editor state)
  const [isJdPanelOpen, setIsJdPanelOpen] = React.useState(false);

  // Update URL when version changes
  const updateUrlWithVersion = (versionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('versionId', versionId);
    router.replace(`/projects/${projectId}/editor?${params.toString()}`, { scroll: false });
  };

  const handleSave = async () => {
    await saveEdit((newVersionId) => {
      console.log('Save successful, new version:', newVersionId);
      // Update URL to reflect new version
      updateUrlWithVersion(newVersionId);
    });
  };

  const handleCompile = async () => {
    await compileVersion();
  };

  const handleVersionSwitch = async (versionId: string) => {
    await switchVersion(versionId);
    // Update URL to reflect switched version
    updateUrlWithVersion(versionId);
  };

  // FIXED: Load version from URL param ONLY if provided
  // If no versionId, empty state will be shown (no version loaded)
  useEffect(() => {
    if (initialVersionId) {
      loadVersion(initialVersionId);
    }
    // If initialVersionId is null/undefined, component shows empty state automatically
  }, [initialVersionId, loadVersion]);

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <EditorToolbar
        isDirty={isDirty}
        isLoading={isLoading}
        onSave={handleSave}
        onCompile={handleCompile}
        currentVersionId={currentVersionId}
        projectId={projectId}
      />
      
      {/* JD Panel Toggle Button */}
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
        <button
          onClick={() => setIsJdPanelOpen(!isJdPanelOpen)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {isJdPanelOpen ? '← Hide Job Descriptions' : '→ Show Job Descriptions'}
        </button>
      </div>

      {/* Version Selector */}
      <VersionSelector
        currentVersionId={currentVersionId}
        projectId={projectId}
        onVersionSwitch={handleVersionSwitch}
        isDirty={isDirty}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Main Editor Layout: LEFT | CENTER | RIGHT (conditional) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: LaTeX Editor or Empty State */}
        <div className={isJdPanelOpen ? 'w-1/3 border-r border-gray-200' : 'w-1/2 border-r border-gray-200'}>
          {!currentVersionId && !isLoading ? (
            /* Empty State - No Version Loaded */
            <div className="flex h-full items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-6">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-base font-medium text-gray-900">No Version Loaded</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Load a version using the selector above to begin editing.
                </p>
              </div>
            </div>
          ) : (
            <LaTeXEditor
              value={latexDraft}
              onChange={updateDraft}
              isDirty={isDirty}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* CENTER: PDF Preview */}
        <div className={isJdPanelOpen ? 'w-1/3 border-r border-gray-200' : 'w-1/2'}>
          <PDFPreview
            pdfUrl={currentVersion?.pdfUrl || null}
            versionId={currentVersionId}
          />
        </div>

        {/* RIGHT: JD Panel (conditional) */}
        {isJdPanelOpen && (
          <div className="w-1/3">
            <JdPanel 
              projectId={projectId} 
              baseVersionId={currentVersionId}
              baseLatexContent={latexDraft}
              onVersionChange={(newVersionId) => {
                switchVersion(newVersionId);
              }}
              getToken={getToken}
            />
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm font-medium text-gray-700">Loading...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

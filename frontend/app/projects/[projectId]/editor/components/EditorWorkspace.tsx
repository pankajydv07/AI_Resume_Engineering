'use client';

import React, { useEffect } from 'react';
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
}

export function EditorWorkspace({ projectId }: EditorWorkspaceProps) {
  const {
    currentVersionId,
    latexDraft,
    isDirty,
    isLoading,
    error,
    currentVersion,
    loadVersion,
    updateDraft,
    switchVersion,
    saveEdit,
  } = useEditorState(projectId);

  // PHASE 4: JD Panel visibility state (completely separate from editor state)
  const [isJdPanelOpen, setIsJdPanelOpen] = React.useState(false);

  const handleSave = async () => {
    await saveEdit((newVersionId) => {
      console.log('Save successful, new version:', newVersionId);
    });
  };

  // TODO: Load initial version (need to determine which version to load)
  // Options:
  // 1. Get version from URL query param (?versionId=xxx)
  // 2. Load ACTIVE version (when status tracking is implemented)
  // 3. Load latest version (when version listing API is available)
  useEffect(() => {
    // Placeholder: Manual version loading required
    // User must provide versionId to test editor
    console.log('Editor mounted for project:', projectId);
  }, [projectId]);

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <EditorToolbar
        isDirty={isDirty}
        isLoading={isLoading}
        onSave={handleSave}
        currentVersionId={currentVersionId}
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
        onVersionSwitch={switchVersion}
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
        {/* LEFT: LaTeX Editor */}
        <div className={isJdPanelOpen ? 'w-1/3 border-r border-gray-200' : 'w-1/2 border-r border-gray-200'}>
          <LaTeXEditor
            value={latexDraft}
            onChange={updateDraft}
            isDirty={isDirty}
            isLoading={isLoading}
          />
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
            <JdPanel projectId={projectId} />
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

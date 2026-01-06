'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditorState } from '../hooks/useEditorState';
import { useToast } from '@/components/ui/Toast';
import { HeaderBar } from './HeaderBar';
import { LaTeXEditor } from './LaTeXEditor';
import { PDFPreview } from './PDFPreview';
import { AiPanel } from './ai/AiPanel';

/**
 * PHASE 3: Main Editor Workspace Component
 * REDESIGNED: Non-blocking loading with toast notifications
 * 
 * Per userflow.md Section 2.5:
 * - Layout: LEFT (LaTeX Editor) | RIGHT (PDF Preview)
 * - Manages editor state via useEditorState hook
 * - Handles version switching, saving, and editing
 * 
 * UX IMPROVEMENTS:
 * - Toast notifications for background processes
 * - Non-blocking loading states
 * - Users can continue working while operations run
 */

interface EditorWorkspaceProps {
  projectId: string;
  initialVersionId?: string | null;
}

export function EditorWorkspace({ projectId, initialVersionId }: EditorWorkspaceProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast, updateToast, removeToast } = useToast();
  const toastIdRef = useRef<string | null>(null);
  
  const {
    currentVersionId,
    latexDraft,
    isDirty,
    isLoading,
    isSaving,
    isCompiling,
    error,
    currentVersion,
    loadVersion,
    loadLatestVersion,
    updateDraft,
    switchVersion,
    saveEdit,
    compileVersion,
  } = useEditorState(projectId, getToken);

  // Panel mode: 'pdf' or 'ai' (mutually exclusive)
  const [panelMode, setPanelMode] = React.useState<'pdf' | 'ai'>('pdf');

  // Update URL when version changes
  const updateUrlWithVersion = (versionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('versionId', versionId);
    router.replace(`/projects/${projectId}/editor?${params.toString()}`, { scroll: false });
  };

  const handleSave = async () => {
    const toastId = addToast({
      type: 'loading',
      title: 'Saving changes...',
      message: 'Creating new version',
    });
    
    try {
      await saveEdit((newVersionId) => {
        updateToast(toastId, {
          type: 'success',
          title: 'Saved successfully',
          message: 'New version created',
          duration: 3000,
        });
        updateUrlWithVersion(newVersionId);
      });
    } catch {
      updateToast(toastId, {
        type: 'error',
        title: 'Save failed',
        message: error || 'Could not save changes',
        duration: 5000,
      });
    }
  };

  const handleCompile = async () => {
    const toastId = addToast({
      type: 'loading',
      title: 'Compiling PDF...',
      message: 'This may take a moment',
    });
    
    try {
      await compileVersion();
      updateToast(toastId, {
        type: 'success',
        title: 'PDF compiled',
        message: 'Preview updated',
        duration: 3000,
      });
    } catch {
      updateToast(toastId, {
        type: 'error',
        title: 'Compilation failed',
        message: error || 'Check LaTeX syntax',
        duration: 5000,
      });
    }
  };

  const handleVersionSwitch = async (versionId: string) => {
    const toastId = addToast({
      type: 'loading',
      title: 'Loading version...',
    });
    
    try {
      await switchVersion(versionId);
      removeToast(toastId);
      updateUrlWithVersion(versionId);
    } catch {
      updateToast(toastId, {
        type: 'error',
        title: 'Failed to load version',
        duration: 4000,
      });
    }
  };

  // Load version from URL param
  useEffect(() => {
    if (initialVersionId) {
      loadVersion(initialVersionId);
    }
  }, [initialVersionId, loadVersion]);

  return (
    <div className="flex flex-col h-screen bg-dark-950">
      {/* Unified Header Bar with glassmorphism */}
      <HeaderBar
        projectId={projectId}
        currentVersionId={currentVersionId}
        currentVersionStatus={currentVersion?.status || null}
        isDirty={isDirty}
        isLoading={isLoading}
        error={error}
        panelMode={panelMode}
        onPanelModeChange={setPanelMode}
        onSave={handleSave}
        onCompile={handleCompile}
        onVersionSwitch={handleVersionSwitch}
      />
      
      {/* Main Editor Layout: LEFT (Editor) | RIGHT (PDF or AI - mutually exclusive) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Vertical separator with gradient */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary-500/30 to-transparent z-20 pointer-events-none"></div>
        
        {/* LEFT: LaTeX Editor or Empty State */}
        <div className="w-1/2 border-r border-white/5">
          {!currentVersionId && !isLoading ? (
            /* Empty State - No Version Loaded */
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
              
              <div className="text-center max-w-md px-6 relative z-10">
                <div className="glass-card p-8 rounded-2xl shadow-glow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Version Loaded</h3>
                  <p className="text-sm text-dark-400 mb-4">
                    Load a version using the selector above to begin editing your resume.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-dark-500">
                    <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></div>
                    <span>Ready to start</span>
                  </div>
                </div>
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

        {/* RIGHT: PDF Preview or AI Panel (mutually exclusive) */}
        <div className="w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            {/* PDF Preview with fade transition */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                panelMode === 'pdf' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <PDFPreview
                pdfUrl={currentVersion?.pdfUrl || null}
                versionId={currentVersionId}
              />
            </div>
            {/* AI Panel with fade transition */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                panelMode === 'ai' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <AiPanel 
                projectId={projectId} 
                baseVersionId={currentVersionId}
                baseLatexContent={latexDraft}
                onVersionChange={async (newVersionId) => {
                  await switchVersion(newVersionId);
                  updateUrlWithVersion(newVersionId);
                }}
                getToken={getToken}
                isEditorLocked={isSaving || isCompiling}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inline Loading Indicator - Non-blocking, shows only during initial load */}
      {isLoading && !currentVersionId && (
        <div className="fixed bottom-8 right-8 z-40 animate-slide-up">
          <div className="glass-card px-5 py-3 rounded-xl shadow-glow flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-white">Loading version...</span>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEditorState } from '../hooks/useEditorState';
import { useToast } from '@/components/ui/Toast';
import { EditorHeader } from './EditorHeader';
import { LaTeXEditor } from './LaTeXEditor';
import { PDFPreview } from './PDFPreview';
import { AiPanel } from './ai/AiPanel';
import { FileText, Sparkles } from 'lucide-react';

/**
 * REFACTORED EDITOR WORKSPACE
 * 
 * Clean, minimal design with:
 * - Floating header with glassmorphism
 * - Smooth panel transitions
 * - Modern empty states
 * - Toast notifications for feedback
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
    updateDraft,
    switchVersion,
    saveEdit,
    compileVersion,
  } = useEditorState(projectId, getToken);

  // Panel mode: 'pdf' or 'ai'
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Gradient orbs */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <EditorHeader
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
      
      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* LEFT: LaTeX Editor */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-1/2 rounded-2xl overflow-hidden border border-white/10 bg-gray-900/50 backdrop-blur-sm shadow-2xl"
        >
          {!currentVersionId && !isLoading ? (
            <EmptyEditorState />
          ) : (
            <LaTeXEditor
              value={latexDraft}
              onChange={updateDraft}
              isDirty={isDirty}
              isLoading={isLoading}
            />
          )}
        </motion.div>

        {/* RIGHT: PDF Preview or AI Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-1/2 rounded-2xl overflow-hidden border border-white/10 bg-gray-900/50 backdrop-blur-sm shadow-2xl relative"
        >
          {/* PDF Preview */}
          <div
            className={`absolute inset-0 transition-all duration-300 ease-out ${
              panelMode === 'pdf' 
                ? 'opacity-100 translate-x-0 z-10' 
                : 'opacity-0 -translate-x-4 z-0 pointer-events-none'
            }`}
          >
            <PDFPreview
              pdfUrl={currentVersion?.pdfUrl || null}
              versionId={currentVersionId}
            />
          </div>
          
          {/* AI Panel */}
          <div
            className={`absolute inset-0 transition-all duration-300 ease-out ${
              panelMode === 'ai' 
                ? 'opacity-100 translate-x-0 z-10' 
                : 'opacity-0 translate-x-4 z-0 pointer-events-none'
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
        </motion.div>
      </div>

      {/* Loading Overlay - Only on initial load */}
      {isLoading && !currentVersionId && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-300">Loading version...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Empty State Component
function EmptyEditorState() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
          <div className="relative w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        {/* Text */}
        <h3 className="text-xl font-semibold text-white mb-2">No Version Loaded</h3>
        <p className="text-gray-400 text-sm mb-6">
          Select a version from the dropdown above to start editing your resume.
        </p>
        
        {/* Hint */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-400">
            Or switch to <span className="text-purple-400 font-medium">AI mode</span> to generate a new version
          </span>
        </div>
      </motion.div>
    </div>
  );
}

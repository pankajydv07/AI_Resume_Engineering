'use client';

import { useState, useCallback, useEffect } from 'react';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';

/**
 * PHASE 3: Editor State Management Hook
 * 
 * WHY THIS EXISTS:
 * Version immutability is the foundation of safe AI collaboration. Users need confidence
 * that they can experiment with AI proposals without fear of losing their work. This hook
 * enforces the contract: versions are read-only after creation, edits spawn new versions.
 * 
 * WHY IN-MEMORY DRAFT:
 * The `latexDraft` state lives in-memory (not backend) because users should be able to
 * type freely without network overhead. The `isDirty` flag signals when unsaved work exists,
 * preventing accidental navigation away from edits.
 * 
 * WHY NO MUTATIONS:
 * Backend versions are immutable. We never PATCH existing versions. Every save creates
 * a new version with type=MANUAL. This preserves audit history and enables safe rollback.
 * 
 * UX IMPROVEMENTS (NON-BLOCKING):
 * - Separate loading states for different operations
 * - isSaving: True during save operation (non-blocking)
 * - isCompiling: True during compile operation (non-blocking)
 * - isLoading: True during initial load only
 */

interface ResumeVersion {
  versionId: string;
  projectId: string;
  type: 'BASE' | 'MANUAL' | 'AI_GENERATED';
  status: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE';
  latexContent: string;
  pdfUrl: string | null;
  createdAt: string;
}

interface EditorState {
  currentVersionId: string | null;
  latexDraft: string;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isCompiling: boolean;
  error: string | null;
  currentVersion: ResumeVersion | null;
}

export function useEditorState(projectId: string, getToken: () => Promise<string | null>) {
  const [state, setState] = useState<EditorState>({
    currentVersionId: null,
    latexDraft: '',
    isDirty: false,
    isLoading: false,
    isSaving: false,
    isCompiling: false,
    error: null,
    currentVersion: null,
  });

  /**
   * Load version from API
   * Per apis.md: GET /api/versions/{versionId}
   */
  const loadVersion = useCallback(async (versionId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // PHASE 8: Real Clerk JWT authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl(`/api/versions/${versionId}`), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const version: ResumeVersion = await response.json();

      // Reset editor state on version load
      setState({
        currentVersionId: version.versionId,
        latexDraft: version.latexContent,
        isDirty: false,
        isLoading: false,
        isSaving: false,
        isCompiling: false,
        error: null,
        currentVersion: version,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(err),
      }));
    }
  }, []);

  /**
   * Update draft content (in-memory only)
   * Sets isDirty=true when modified
   * 
   * PHASE 3 HARDENING: Compare against saved version content, not previous draft
   * This ensures isDirty is correct during version switching scenarios
   */
  const updateDraft = useCallback((newContent: string) => {
    setState(prev => ({
      ...prev,
      latexDraft: newContent,
      isDirty: prev.currentVersion?.latexContent !== newContent,
    }));
  }, []);

  /**
   * Switch to different version
   * Resets editor state per requirements
   */
  const switchVersion = useCallback(async (versionId: string) => {
    // Reset state before loading new version
    setState(prev => ({
      ...prev,
      currentVersionId: null,
      latexDraft: '',
      isDirty: false,
      isLoading: true,
      isSaving: false,
      isCompiling: false,
      error: null,
      currentVersion: null,
    }));

    await loadVersion(versionId);
  }, [loadVersion]);

  /**
   * @deprecated NO LONGER USED - REMOVED NON-EXISTENT API CALL
   * 
   * PREVIOUS IMPLEMENTATION ATTEMPTED TO CALL:
   *   GET /api/versions/project/:projectId
   * 
   * This endpoint does NOT exist in apis.md and violates the contract.
   * 
   * NEW FLOW (FIXED):
   * - Dashboard passes baseVersionId via URL: /editor?versionId=xxx
   * - Editor reads versionId from URL params
   * - Editor calls existing endpoint: GET /api/versions/:versionId
   * 
   * This function is kept for compatibility but should not be called.
   */
  const loadLatestVersion = useCallback(async () => {
    console.warn('loadLatestVersion is deprecated and should not be called');
    setState(prev => ({
      ...prev,
      currentVersionId: null,
      latexDraft: '',
      isDirty: false,
      isLoading: false,
      isSaving: false,
      isCompiling: false,
      error: 'No version specified. Please select a version from the dashboard.',
      currentVersion: null,
    }));
  }, []);

  /**
   * Save manual edit (NON-BLOCKING)
   * Per apis.md Section 4.2: PUT /api/versions/{versionId}
   * Creates new MANUAL version, returns newVersionId
   * Uses isSaving state instead of blocking isLoading
   */
  const saveEdit = useCallback(async (onSuccess?: (newVersionId: string) => void) => {
    if (!state.currentVersionId) {
      throw new Error('No version loaded');
    }

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      // PHASE 8: Real Clerk JWT authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl(`/api/versions/${state.currentVersionId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latexContent: state.latexDraft,
        }),
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();
      const newVersionId = result.newVersionId;

      // Load the newly created version (this will reset isSaving)
      await loadVersion(newVersionId);

      // Trigger success callback if provided
      if (onSuccess) {
        onSuccess(newVersionId);
      }

      return newVersionId;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: getErrorMessage(err),
      }));
      throw err;
    }
  }, [state.currentVersionId, state.latexDraft, loadVersion]);

  /**
   * Compile current version to PDF (NON-BLOCKING)
   * Per apis.md Section 4.3: POST /api/versions/{versionId}/compile
   * Uses isCompiling state instead of blocking isLoading
   * 
   * PHASE 8: LaTeX compilation with pdflatex
   * - Calls backend compile endpoint
   * - Backend compiles LaTeX → PDF
   * - Backend uploads to Cloudinary
   * - Backend updates version.pdfUrl
   * - Frontend reloads version to get updated pdfUrl
   */
  const compileVersion = useCallback(async () => {
    if (!state.currentVersionId) {
      throw new Error('No version loaded');
    }

    setState(prev => ({ ...prev, isCompiling: true, error: null }));

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl(`/api/versions/${state.currentVersionId}/compile`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();

      if (result.status === 'error') {
        // Compilation failed completely
        const errorMsg = result.errors.length > 0 
          ? `Compilation failed:\n${result.errors.join('\n')}`
          : 'Compilation failed';
        
        setState(prev => ({
          ...prev,
          isCompiling: false,
          error: errorMsg,
        }));
        throw new Error(errorMsg);
      }

      // Compilation succeeded (with or without warnings) - reload version to get updated pdfUrl
      await loadVersion(state.currentVersionId);
      
      // Reset compiling state after reload
      setState(prev => ({ ...prev, isCompiling: false }));
      
      // If there were warnings, show them but don't block
      if (result.status === 'warning' && result.errors.length > 0) {
        setState(prev => ({
          ...prev,
          error: `⚠️ PDF compiled with warnings:\n${result.errors.join('\n')}`,
        }));
      }

    } catch (err) {
      setState(prev => ({
        ...prev,
        isCompiling: false,
        error: getErrorMessage(err),
      }));
      throw err;
    }
  }, [state.currentVersionId, loadVersion, getToken]);

  return {
    // State
    currentVersionId: state.currentVersionId,
    latexDraft: state.latexDraft,
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isCompiling: state.isCompiling,
    error: state.error,
    currentVersion: state.currentVersion,
    
    // Actions
    loadVersion,
    loadLatestVersion,
    updateDraft,
    switchVersion,
    saveEdit,
    compileVersion,
  };
}

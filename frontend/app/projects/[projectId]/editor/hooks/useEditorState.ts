'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * PHASE 3: Editor State Management Hook
 * 
 * Per requirements:
 * - Load ResumeVersion via GET /api/versions/{versionId}
 * - Store in-memory state: currentVersionId, latexDraft, isDirty
 * - Editing updates latexDraft only
 * - Switching versions resets editor state
 * 
 * Per apis.md Section 4.1:
 * - GET /api/versions/{versionId} returns:
 *   { versionId, projectId, type, status, latexContent, pdfUrl, createdAt }
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
  error: string | null;
  currentVersion: ResumeVersion | null;
}

export function useEditorState(projectId: string) {
  const [state, setState] = useState<EditorState>({
    currentVersionId: null,
    latexDraft: '',
    isDirty: false,
    isLoading: false,
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
      // TODO: Replace with real Clerk token when auth is implemented
      const response = await fetch(`http://localhost:3001/api/versions/${versionId}`, {
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header with Clerk JWT
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load version: ${response.statusText}`);
      }

      const version: ResumeVersion = await response.json();

      // Reset editor state on version load
      setState({
        currentVersionId: version.versionId,
        latexDraft: version.latexContent,
        isDirty: false,
        isLoading: false,
        error: null,
        currentVersion: version,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
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
    setState({
      currentVersionId: null,
      latexDraft: '',
      isDirty: false,
      isLoading: true,
      error: null,
      currentVersion: null,
    });

    await loadVersion(versionId);
  }, [loadVersion]);

  /**
   * Save manual edit
   * Per apis.md Section 4.2: PUT /api/versions/{versionId}
   * Creates new MANUAL version, returns newVersionId
   */
  const saveEdit = useCallback(async (onSuccess?: (newVersionId: string) => void) => {
    if (!state.currentVersionId) {
      throw new Error('No version loaded');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Replace with real Clerk token when auth is implemented
      const response = await fetch(`http://localhost:3001/api/versions/${state.currentVersionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header with Clerk JWT
        },
        body: JSON.stringify({
          latexContent: state.latexDraft,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save edit: ${response.statusText}`);
      }

      const result = await response.json();
      const newVersionId = result.newVersionId;

      // Load the newly created version
      await loadVersion(newVersionId);

      // Trigger success callback if provided
      if (onSuccess) {
        onSuccess(newVersionId);
      }

      return newVersionId;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
      throw err;
    }
  }, [state.currentVersionId, state.latexDraft, loadVersion]);

  return {
    // State
    currentVersionId: state.currentVersionId,
    latexDraft: state.latexDraft,
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    error: state.error,
    currentVersion: state.currentVersion,
    
    // Actions
    loadVersion,
    updateDraft,
    switchVersion,
    saveEdit,
  };
}

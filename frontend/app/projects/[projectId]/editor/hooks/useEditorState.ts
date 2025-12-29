'use client';

import { useState, useCallback, useEffect } from 'react';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';

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
          // FUTURE PHASE 8: Add Authorization header with Clerk JWT
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
   * PHASE 7.3: Load latest version for project
   * Fetches all versions and loads the most recent one
   * Safe for refresh scenarios
   */
  const loadLatestVersion = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch all versions for this project
      const response = await fetch(`http://localhost:3001/api/versions/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
          // FUTURE PHASE 8: Add Authorization header with Clerk JWT
        },
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const versions: ResumeVersion[] = await response.json();

      // If no versions exist, show empty state (not an error)
      if (versions.length === 0) {
        setState({
          currentVersionId: null,
          latexDraft: '',
          isDirty: false,
          isLoading: false,
          error: null,
          currentVersion: null,
        });
        return;
      }

      // Sort by createdAt descending and load the most recent
      const sortedVersions = [...versions].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestVersion = sortedVersions[0];

      // Load the latest version
      await loadVersion(latestVersion.versionId);
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(err),
      }));
    }
  }, [projectId, loadVersion]);

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
      // FUTURE PHASE 8: Replace with real Clerk JWT token
      // Currently: Backend accepts any bearer token for development
      // Production: Must validate Clerk JWT signature and claims
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
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
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
        error: getErrorMessage(err),
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
    loadLatestVersion,
    updateDraft,
    switchVersion,
    saveEdit,
  };
}

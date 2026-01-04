'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';

/**
 * PHASE 3: Version Selector Component
 * PHASE 10: Fully functional with version dropdown
 * 
 * WHY VERSION SWITCHING EXISTS:
 * Users need to compare and revert to previous resume states. This component enforces
 * a critical safety rule: switching versions discards in-memory edits (isDirty check).
 * This prevents confusion about which version is being edited.
 * 
 * WHY WARN ON DIRTY:
 * If user has typed changes but not saved, switching versions would silently lose that work.
 * The confirmation dialog forces an intentional choice: save first, or discard.
 */

interface Version {
  versionId: string;
  projectId: string;
  type: 'BASE' | 'MANUAL' | 'AI_GENERATED';
  status: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE';
  createdAt: string;
  parentVersionId: string | null;
}

interface VersionSelectorProps {
  currentVersionId: string | null;
  projectId: string;
  onVersionSwitch: (versionId: string) => Promise<void>;
  isDirty: boolean;
}

export function VersionSelector({
  currentVersionId,
  projectId,
  onVersionSwitch,
  isDirty,
}: VersionSelectorProps) {
  const { getToken } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch versions on mount, when projectId changes, or when currentVersionId changes
  // This ensures the list updates after saving (which creates a new version)
  useEffect(() => {
    if (projectId) {
      fetchVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentVersionId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl(`/api/versions/project/${projectId}`), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const data: Version[] = await response.json();
      setVersions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = async (versionId: string) => {
    if (versionId === currentVersionId) {
      setIsDropdownOpen(false);
      return;
    }

    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Switching versions will discard them. Continue?'
      );
      if (!confirmed) return;
    }

    setIsDropdownOpen(false);
    await onVersionSwitch(versionId);
  };

  const formatVersionLabel = (version: Version): string => {
    const typeLabels = {
      BASE: '🏠 Base',
      MANUAL: '✏️ Manual',
      AI_GENERATED: '🤖 AI',
    };

    const statusBadge = version.status === 'ACTIVE' ? ' (Active)' : '';
    const date = new Date(version.createdAt).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${typeLabels[version.type]} - ${date}${statusBadge}`;
  };

  const currentVersion = versions.find(v => v.versionId === currentVersionId);

  return (
    <div className="px-4 py-3 border-b border-white/10 bg-zinc-900/40 backdrop-blur-sm">
      <label className="block text-xs font-medium text-zinc-400 mb-2">
        Version Selector
      </label>
      
      {error && (
        <div className="mb-2 text-xs text-red-400">
          Failed to load versions: {error}
        </div>
      )}

      {currentVersionId ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isLoading || versions.length === 0}
            className="w-full flex items-center justify-between px-3 py-2 text-sm bg-zinc-800/60 backdrop-blur-sm border border-white/10 rounded-md hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-zinc-900/30 disabled:cursor-not-allowed text-zinc-200 transition-colors"
          >
            <span className="text-left">
              {currentVersion ? formatVersionLabel(currentVersion) : 'Loading...'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform text-zinc-400 ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && versions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {versions.map((version) => (
                <button
                  key={version.versionId}
                  type="button"
                  onClick={() => handleSwitch(version.versionId)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800/80 transition-colors ${
                    version.versionId === currentVersionId
                      ? 'bg-blue-600/20 text-blue-300 font-medium'
                      : 'text-zinc-300'
                  }`}
                >
                  {formatVersionLabel(version)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 text-xs text-zinc-500">
            {versions.length} version{versions.length !== 1 ? 's' : ''} available
          </div>
        </div>
      ) : (
        <div className="text-sm text-zinc-500 italic">
          No version loaded
        </div>
      )}
    </div>
  );
}

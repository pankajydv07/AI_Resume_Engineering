'use client';

import { useState, useEffect } from 'react';

/**
 * PHASE 4: JD List Component
 * 
 * Displays job descriptions for a project
 * Allows selecting ONE JD (state only, no side effects)
 * 
 * Per apis.md Section 5.3:
 * - GET /jd/project/{projectId}
 * - Returns: [{ jdId, projectId, rawText, createdAt }]
 * 
 * Forbidden:
 * - No search
 * - No filters
 * - No derived metadata
 */

interface JobDescription {
  jdId: string;
  projectId: string;
  rawText: string;
  createdAt: string;
}

interface JdListProps {
  projectId: string;
  selectedJdId: string | null;
  onJdSelected: (jdId: string) => void;
  refreshTrigger?: number; // External trigger to refresh list
}

export function JdList({ projectId, selectedJdId, onJdSelected, refreshTrigger }: JdListProps) {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJds = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with real Clerk token when auth is implemented
      const response = await fetch(`http://localhost:3001/api/jd/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user-123',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load JDs: ${response.statusText}`);
      }

      const data: JobDescription[] = await response.json();
      setJds(data); // Already sorted by createdAt DESC from backend
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load JDs on mount and when refreshTrigger changes
  useEffect(() => {
    loadJds();
  }, [projectId, refreshTrigger]);

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Job Descriptions
        </h3>
        <button
          type="button"
          onClick={loadJds}
          disabled={isLoading}
          className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 mb-3">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* JD List */}
      {isLoading ? (
        <div className="text-sm text-gray-500 text-center py-4">
          Loading job descriptions...
        </div>
      ) : jds.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">
          No job descriptions submitted yet
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {jds.map((jd) => (
            <button
              key={jd.jdId}
              type="button"
              onClick={() => onJdSelected(jd.jdId)}
              className={`w-full text-left p-3 border rounded transition-colors ${
                selectedJdId === jd.jdId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {formatDate(jd.createdAt)}
              </div>
              <div className="text-sm text-gray-700 font-mono">
                {truncateText(jd.rawText, 100)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selection Info */}
      {selectedJdId && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            Selected JD ID: <span className="font-mono">{selectedJdId.substring(0, 8)}...</span>
          </div>
        </div>
      )}
    </div>
  );
}

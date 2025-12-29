'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Job Descriptions Page (/projects/{projectId}/jd)
 * 
 * PHASE 7.2: UX FLOW CLEANUP - Standalone JD page with breadcrumbs
 * 
 * Purpose:
 * - Standalone page to view all Job Descriptions for a project
 * - Clear empty state when no JDs added yet
 * 
 * Forbidden:
 * - No JD creation form (access via editor JD panel)
 * - No AI job triggers
 * - No auto-actions
 */

interface JobDescription {
  jdId: string;
  projectId: string;
  rawText: string;
  createdAt: string;
}

export default function JobDescriptionsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [jds, setJds] = useState<JobDescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobDescriptions();
  }, [projectId]);

  const fetchJobDescriptions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/jd/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user-123',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job descriptions: ${response.statusText}`);
      }

      const data: JobDescription[] = await response.json();
      setJds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Breadcrumbs */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* PHASE 7.2: Breadcrumbs */}
          <nav className="flex items-center text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Dashboard
            </Link>
            <span className="mx-2">›</span>
            <Link href={`/projects/${projectId}`} className="hover:text-gray-900 transition">
              Project
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">Job Descriptions</span>
          </nav>
          <h1 className="text-xl font-semibold text-gray-900">Job Descriptions</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Loading job descriptions...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && jds.length === 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
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
              <h3 className="mt-6 text-lg font-medium text-gray-900">No Job Descriptions Yet</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Job descriptions are used to tailor your resume for specific positions. Add them from the editor's JD panel.
              </p>
              <div className="mt-6">
                <Link
                  href={`/projects/${projectId}/editor`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Go to Editor
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* JD List */}
        {!isLoading && !error && jds.length > 0 && (
          <div className="space-y-4">
            {jds.map((jd) => (
              <div key={jd.jdId} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">
                      Added: {formatDate(jd.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {jd.jdId.substring(0, 8)}
                  </span>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {truncateText(jd.rawText)}
                </div>
                {jd.rawText.length > 150 && (
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Full Description
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

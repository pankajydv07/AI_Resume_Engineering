'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';

/**
 * AI Jobs Page (/projects/{projectId}/ai-jobs)
 * 
 * PHASE 7.2: UX FLOW CLEANUP - Standalone AI Jobs page with breadcrumbs
 * 
 * Purpose:
 * - Standalone page to view all AI tailoring jobs for a project
 * - Clear empty state explaining prerequisites
 * 
 * Forbidden:
 * - No AI job creation (triggered from editor)
 * - No auto-actions
 */

interface AIJob {
  aiJobId: string;
  projectId: string;
  jdId: string;
  baseVersionId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt: string | null;
}

export default function AIJobsPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const projectId = params.projectId as string;

  const [aiJobs, setAiJobs] = useState<AIJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIJobs();
  }, [projectId]);

  const fetchAIJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // PHASE 8: Real Clerk JWT authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:3001/api/ai-jobs/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const data: AIJob[] = await response.json();
      setAiJobs(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'QUEUED': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <span className="text-gray-900 font-medium">AI Jobs</span>
          </nav>
          <h1 className="text-xl font-semibold text-gray-900">AI Tailoring Jobs</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Loading AI jobs...</span>
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
        {!isLoading && !error && aiJobs.length === 0 && (
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h3 className="mt-6 text-lg font-medium text-gray-900">No AI Jobs Yet</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                AI tailoring jobs are created when you request the AI to optimize your resume for a specific job description.
              </p>
              <div className="mt-4 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
                <p className="font-medium text-blue-900 mb-2">Prerequisites:</p>
                <ul className="text-left space-y-1">
                  <li>• Have a base resume version loaded in the editor</li>
                  <li>• Add at least one job description via the JD panel</li>
                  <li>• Click "Tailor to JD" in the editor to start AI processing</li>
                </ul>
              </div>
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

        {/* AI Jobs List */}
        {!isLoading && !error && aiJobs.length > 0 && (
          <div className="space-y-4">
            {aiJobs.map((job) => (
              <div key={job.aiJobId} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {job.aiJobId.substring(0, 8)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Created: {formatDate(job.createdAt)}
                    </p>
                    {job.completedAt && (
                      <p className="text-sm text-gray-600">
                        Completed: {formatDate(job.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <span className="text-gray-500">Base Version:</span>
                    <p className="text-gray-900 font-mono">{job.baseVersionId.substring(0, 8)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Job Description:</span>
                    <p className="text-gray-900 font-mono">{job.jdId.substring(0, 8)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';

/**
 * Project Detail Page (/projects/{projectId})
 * 
 * PHASE 7.1: DASHBOARD & NAVIGATION
 * 
 * Purpose:
 * - Navigation hub for project
 * - Shows project metadata
 * - Provides links to Editor, Job Descriptions, AI Jobs
 * 
 * Forbidden:
 * - No editor rendering here
 * - No JD forms here
 * - No AI buttons here
 * - No business logic
 */

interface ProjectMetadata {
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
}

interface VersionListItem {
  versionId: string;
  projectId: string;
  type: 'BASE' | 'MANUAL' | 'AI_GENERATED';
  status: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE';
  createdAt: string;
  parentVersionId: string | null;
}

export default function ProjectPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectMetadata | null>(null);
  const [versions, setVersions] = useState<VersionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /**
   * Fetch project metadata and versions using ONLY legal endpoints from apis.md
   * - GET /projects → project list
   * - GET /versions/project/{projectId} → version list
   */
  const fetchProjectData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Fetch project metadata from GET /projects (apis.md Section 3.2)
      const projectsResponse = await fetch(apiUrl('/api/projects'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!projectsResponse.ok) {
        const errorInfo = await handleHttpError(projectsResponse);
        throw errorInfo;
      }

      const projects: ProjectMetadata[] = await projectsResponse.json();
      const currentProject = projects.find(p => p.projectId === projectId);

      if (!currentProject) {
        setError('Project not found');
        setIsLoading(false);
        return;
      }

      setProject(currentProject);

      // Fetch versions from GET /versions/project/{projectId} (apis.md Section 4.4)
      const versionsResponse = await fetch(
        apiUrl(`/api/versions/project/${projectId}`),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (versionsResponse.ok) {
        const versionList: VersionListItem[] = await versionsResponse.json();
        setVersions(versionList);
      } else {
        // Non-critical: project exists but no versions yet
        setVersions([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              {project ? project.name : 'Project Details'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Loading project...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-sm text-red-800 mb-2">
              <strong>Error:</strong> {error}
            </p>
            {error === 'Project not found' && (
              <div className="mt-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Project Content */}
        {!isLoading && !error && project && (
          <div className="space-y-6">
            {/* Project Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {project.name}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="text-gray-900 font-medium">{formatDate(project.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <p className="text-gray-900 font-medium">{formatDate(project.updatedAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Versions:</span>
                  <p className="text-gray-900 font-medium">{project.versionCount}</p>
                </div>
              </div>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Editor Link - Contract compliant navigation */}
              {versions.length > 0 ? (
                <Link
                  href={`/projects/${projectId}/editor?versionId=${versions[0].versionId}`}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      Resume Editor
                    </h3>
                    <svg
                      className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    Edit resume versions, view LaTeX, and compile to PDF
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {versions.length} version{versions.length !== 1 ? 's' : ''} available
                  </p>
                </Link>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-500">
                      Resume Editor
                    </h3>
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    No versions available yet
                  </p>
                  <p className="text-xs text-gray-500">
                    A base version should have been created automatically. Try refreshing the page.
                  </p>
                </div>
              )}

              {/* Job Descriptions Link */}
              <Link
                href={`/projects/${projectId}/jd`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    Job Descriptions
                  </h3>
                  <svg
                    className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition"
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
                </div>
                <p className="text-sm text-gray-600">
                  View all saved job descriptions for this project
                </p>
              </Link>

              {/* AI Jobs Link */}
              <Link
                href={`/projects/${projectId}/ai-jobs`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    AI Jobs
                  </h3>
                  <svg
                    className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition"
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
                </div>
                <p className="text-sm text-gray-600">
                  Track AI tailoring jobs and status
                </p>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

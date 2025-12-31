'use client';

import { useState, useEffect } from 'react';
import { UserButton, useAuth } from "@clerk/nextjs";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { handleHttpError, getErrorMessage, isRetryableError } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';

/**
 * Dashboard Page (/dashboard)
 * 
 * PHASE 7.1: DASHBOARD & NAVIGATION
 * 
 * Purpose (from userflow.md):
 * - Show all Resume Projects
 * - Entry point after login
 * 
 * Visible Elements:
 * - List of Resume Projects (name, last updated, number of versions)
 * - "Create New Resume Project" button
 * 
 * Allowed Actions:
 * - Create new project
 * - Open existing project (navigate to /projects/{projectId})
 * 
 * Disallowed:
 * - Resume editing (happens in separate editor page)
 * - AI actions (triggered from editor)
 */

interface ProjectListItem {
  projectId: string;
  name: string;
  updatedAt: string;
  versionCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Project creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Resume upload state
  const [creationMode, setCreationMode] = useState<'scratch' | 'upload'>('scratch');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // PHASE 8: Real Clerk JWT authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl('/api/projects'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const data: ProjectListItem[] = await response.json();
      setProjects(data);
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      setCreateError('Project name is required');
      return;
    }

    if (creationMode === 'upload' && !uploadFile) {
      setCreateError('Please select a file to upload');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      let projectId: string;

      if (creationMode === 'scratch') {
        // Create empty project (existing flow)
        const response = await fetch(apiUrl('/api/projects'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: projectName.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create project: ${response.statusText}`);
        }

        const result = await response.json();
        projectId = result.projectId;
      } else {
        // Upload resume file
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('name', projectName.trim());
        formData.append('file', uploadFile!);

        const response = await fetch(apiUrl('/api/projects/upload'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to upload resume: ${response.statusText}`);
        }

        const result = await response.json();
        projectId = result.projectId;
        
        setIsUploading(false);
      }
      
      // Navigate to project page
      router.push(`/projects/${projectId}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unknown error');
      setIsCreating(false);
      setIsUploading(false);
    }
  };

  const openCreateModal = () => {
    setProjectName('');
    setCreateError(null);
    setCreationMode('scratch');
    setUploadFile(null);
    setIsUploading(false);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!isCreating && !isUploading) {
      setIsCreateModalOpen(false);
      setProjectName('');
      setCreateError(null);
      setCreationMode('scratch');
      setUploadFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/x-tex', 'text/x-tex', 'text/plain'];
      const isPdf = file.type === 'application/pdf';
      const isTex = file.name.endsWith('.tex') || validTypes.includes(file.type);
      
      if (!isPdf && !isTex) {
        setCreateError('Please upload a PDF or LaTeX (.tex) file');
        e.target.value = '';
        return;
      }
      
      setUploadFile(file);
      setCreateError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Resume Projects</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Project Button */}
        <div className="mb-6">
          <button 
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Create New Resume Project
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Loading projects...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating your first resume project.
              </p>
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Create Your First Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects List */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {projects.map((project) => (
                <li key={project.projectId}>
                  <Link
                    href={`/projects/${project.projectId}`}
                    className="block hover:bg-gray-50 transition"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Last updated: {formatDate(project.updatedAt)}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {project.versionCount} {project.versionCount === 1 ? 'version' : 'versions'}
                          </span>
                          <svg
                            className="ml-3 h-5 w-5 text-gray-400"
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
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Resume Project
            </h2>

            <form onSubmit={handleCreateProject}>
              {/* Project Name Input */}
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isCreating || isUploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="e.g., Software Engineer Resume"
                  autoFocus
                />
              </div>

              {/* Creation Mode Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How would you like to start?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="creationMode"
                      value="scratch"
                      checked={creationMode === 'scratch'}
                      onChange={() => {
                        setCreationMode('scratch');
                        setUploadFile(null);
                        setCreateError(null);
                      }}
                      disabled={isCreating || isUploading}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Build from scratch</div>
                      <div className="text-xs text-gray-500">Start with a blank LaTeX template</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="creationMode"
                      value="upload"
                      checked={creationMode === 'upload'}
                      onChange={() => {
                        setCreationMode('upload');
                        setCreateError(null);
                      }}
                      disabled={isCreating || isUploading}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Upload existing resume</div>
                      <div className="text-xs text-gray-500">PDF or LaTeX (.tex) file</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* File Upload (shown when upload mode selected) */}
              {creationMode === 'upload' && (
                <div className="mb-4">
                  <label htmlFor="resumeFile" className="block text-sm font-medium text-gray-700 mb-2">
                    Resume File
                  </label>
                  <input
                    id="resumeFile"
                    type="file"
                    accept=".pdf,.tex,application/pdf,application/x-tex,text/x-tex"
                    onChange={handleFileChange}
                    disabled={isCreating || isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  {isUploading && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span>
                          {uploadFile?.name.endsWith('.pdf') 
                            ? 'Extracting text and generating LaTeX...' 
                            : 'Processing LaTeX file...'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{createError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreating || isUploading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isCreating || 
                    isUploading ||
                    !projectName.trim() ||
                    (creationMode === 'upload' && !uploadFile)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(isCreating || isUploading) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {isCreating || isUploading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { handleHttpError, getErrorMessage, isRetryableError } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { 
  Plus, FileText, Clock, GitBranch, Upload, 
  Sparkles, TrendingUp, CheckCircle, AlertCircle,
  FolderOpen, ArrowRight, Settings, X, Folder
} from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-400 text-lg">Let's get you hired</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={openCreateModal}
              className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">New Project</h3>
              <p className="text-sm text-gray-400">Create a new resume project</p>
            </button>

            <button
              onClick={() => {
                setCreationMode('upload');
                openCreateModal();
              }}
              className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">Upload Resume</h3>
              <p className="text-sm text-gray-400">Start from existing file</p>
            </button>

            <div className="p-6 rounded-xl bg-white/5 border border-white/5 opacity-50 text-left cursor-not-allowed">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">AI Generate</h3>
              <p className="text-sm text-gray-400">Coming soon</p>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Error</p>
                <p className="text-sm text-red-200 mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10"
          >
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-4 text-gray-300">Loading projects...</span>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Get started by creating your first resume project and let AI help you land your dream job.
            </p>
            <button 
              onClick={openCreateModal} 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              Create Your First Project
            </button>
          </motion.div>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && projects.length > 0 && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-6"
            >
              <h2 className="text-2xl font-bold text-white">Your Projects</h2>
              <span className="text-gray-400">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div 
                  key={project.projectId} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Link href={`/projects/${project.projectId}`}>
                    <div className="group cursor-pointer h-full p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:bg-gray-900/70 hover:border-white/20 transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Folder className="w-6 h-6 text-blue-400" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          <span>{project.versionCount} {project.versionCount === 1 ? 'version' : 'versions'}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Click to open</span>
                        <Settings className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeCreateModal}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-w-md w-full rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Create New Project
                </h2>
                <button 
                  onClick={closeCreateModal}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="p-6">
                {/* Project Name Input */}
                <div className="mb-6">
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={isCreating || isUploading}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all disabled:opacity-50"
                    placeholder="e.g., Software Engineer Resume"
                    autoFocus
                  />
                </div>

                {/* Creation Mode Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    How would you like to start?
                  </label>
                  <div className="space-y-3">
                    <label className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      creationMode === 'scratch' 
                        ? "bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}>
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
                        className="mt-1 accent-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          Build from scratch
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Start with a blank LaTeX template</div>
                      </div>
                    </label>
                    
                    <label className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      creationMode === 'upload' 
                        ? "bg-purple-500/10 border-purple-500/30 ring-2 ring-purple-500/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}>
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
                        className="mt-1 accent-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          <Upload className="w-4 h-4 text-purple-400" />
                          Upload existing resume
                        </div>
                        <div className="text-xs text-gray-500 mt-1">PDF or LaTeX (.tex) file</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* File Upload */}
                {creationMode === 'upload' && (
                  <div className="mb-6">
                    <label htmlFor="resumeFile" className="block text-sm font-medium text-gray-300 mb-2">
                      Resume File
                    </label>
                    <input
                      id="resumeFile"
                      type="file"
                      accept=".pdf,.tex,application/pdf,application/x-tex,text/x-tex"
                      onChange={handleFileChange}
                      disabled={isCreating || isUploading}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 file:cursor-pointer cursor-pointer"
                    />
                    {uploadFile && (
                      <p className="mt-2 text-sm text-gray-400">
                        Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    {isUploading && (
                      <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-purple-300">
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
                  <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300">{createError}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={isCreating || isUploading}
                    className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {(isCreating || isUploading) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { UserButton, useAuth } from "@clerk/nextjs";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { handleHttpError, getErrorMessage, isRetryableError } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { FadeIn, SlideUp } from '@/components/ui/Animated';
import { 
  Plus, FileText, Clock, GitBranch, Upload, 
  Sparkles, TrendingUp, CheckCircle, AlertCircle,
  FolderOpen, Settings, ArrowRight
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
    <div className="min-h-screen bg-dark-950">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">ResumeAI</span>
            </Link>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-dark-300 text-lg">Let's get you hired</p>
          </div>
        </FadeIn>

        {/* Quick Actions */}
        <SlideUp delay={0.1}>
          <GlassCard className="mb-8 p-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={openCreateModal}
                className="glass-card p-6 hover:scale-105 transition-all duration-200 hover:shadow-glow group text-left"
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">New Project</h3>
                <p className="text-sm text-dark-400">Create a new resume project</p>
              </button>

              <button
                onClick={() => setCreationMode('upload')}
                className="glass-card p-6 hover:scale-105 transition-all duration-200 hover:shadow-glow-secondary group text-left"
              >
                <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Upload Resume</h3>
                <p className="text-sm text-dark-400">Start from existing file</p>
              </button>

              <div className="glass-card p-6 opacity-60 text-left">
                <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">AI Generate</h3>
                <p className="text-sm text-dark-400">Coming soon</p>
              </div>
            </div>
          </GlassCard>
        </SlideUp>

        {/* Error Display */}
        {error && (
          <SlideUp delay={0.2}>
            <GlassCard className="mb-6 bg-red-500/10 border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300">Error</p>
                  <p className="text-sm text-red-200 mt-1">{error}</p>
                </div>
              </div>
            </GlassCard>
          </SlideUp>
        )}

        {/* Loading State */}
        {isLoading && (
          <SlideUp delay={0.2}>
            <GlassCard>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
                <span className="ml-4 text-dark-300">Loading projects...</span>
              </div>
            </GlassCard>
          </SlideUp>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <SlideUp delay={0.2}>
            <GlassCard className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No projects yet</h3>
              <p className="text-dark-300 mb-6 max-w-md mx-auto">
                Get started by creating your first resume project and let AI help you land your dream job.
              </p>
              <Button onClick={openCreateModal} variant="primary" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </Button>
            </GlassCard>
          </SlideUp>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && projects.length > 0 && (
          <>
            <SlideUp delay={0.2}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Projects</h2>
                <span className="text-dark-400">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
              </div>
            </SlideUp>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <SlideUp key={project.projectId} delay={0.3 + index * 0.05}>
                  <Link href={`/projects/${project.projectId}`}>
                    <GlassCard className="group cursor-pointer h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-dark-400 group-hover:translate-x-1 group-hover:text-primary-400 transition-all" />
                      </div>

                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                        {project.name}
                      </h3>

                      <div className="space-y-2 text-sm text-dark-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          <span>{project.versionCount} {project.versionCount === 1 ? 'version' : 'versions'}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-dark-500">Click to open</span>
                        <Settings className="w-4 h-4 text-dark-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </GlassCard>
                  </Link>
                </SlideUp>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <FadeIn>
            <GlassCard className="max-w-md w-full p-0 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold">
                  Create New Project
                </h2>
              </div>

              <form onSubmit={handleCreateProject} className="p-6">
                {/* Project Name Input */}
                <div className="mb-6">
                  <label htmlFor="projectName" className="block text-sm font-medium mb-2">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={isCreating || isUploading}
                    className="input-primary"
                    placeholder="e.g., Software Engineer Resume"
                    autoFocus
                  />
                </div>

                {/* Creation Mode Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    How would you like to start?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 glass-card cursor-pointer hover:bg-white/10 transition-colors">
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
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-400" />
                          Build from scratch
                        </div>
                        <div className="text-xs text-dark-400 mt-1">Start with a blank LaTeX template</div>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 p-4 glass-card cursor-pointer hover:bg-white/10 transition-colors">
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
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          <Upload className="w-4 h-4 text-secondary-400" />
                          Upload existing resume
                        </div>
                        <div className="text-xs text-dark-400 mt-1">PDF or LaTeX (.tex) file</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* File Upload */}
                {creationMode === 'upload' && (
                  <div className="mb-6">
                    <label htmlFor="resumeFile" className="block text-sm font-medium mb-2">
                      Resume File
                    </label>
                    <input
                      id="resumeFile"
                      type="file"
                      accept=".pdf,.tex,application/pdf,application/x-tex,text/x-tex"
                      onChange={handleFileChange}
                      disabled={isCreating || isUploading}
                      className="w-full px-3 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500/20 file:text-primary-300 hover:file:bg-primary-500/30"
                    />
                    {uploadFile && (
                      <p className="mt-2 text-sm text-dark-400">
                        Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    {isUploading && (
                      <div className="mt-3 p-3 glass-card bg-primary-500/10 border-primary-500/20">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-400 border-t-transparent"></div>
                          <span className="text-primary-300">
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
                  <div className="mb-6 p-3 glass-card bg-red-500/10 border-red-500/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300">{createError}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={isCreating || isUploading}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isCreating || 
                      isUploading ||
                      !projectName.trim() ||
                      (creationMode === 'upload' && !uploadFile)
                    }
                    variant="primary"
                    isLoading={isCreating || isUploading}
                  >
                    {!(isCreating || isUploading) && <Plus className="w-4 h-4 mr-2" />}
                    Create Project
                  </Button>
                </div>
              </form>
            </GlassCard>
          </FadeIn>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';
import { 
  FileCode, Briefcase, Zap, Calendar, GitBranch, 
  ArrowLeft, Sparkles, Clock, ArrowRight, AlertCircle
} from 'lucide-react';

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
  const router = useRouter();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="text-2xl font-bold text-white">
            {project ? project.name : 'Project Details'}
          </h1>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10"
          >
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-4 text-gray-300">Loading project...</span>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300 mb-1">Error</p>
                <p className="text-sm text-red-200">{error}</p>
                {error === 'Project not found' && (
                  <div className="mt-4">
                    <Link href="/dashboard">
                      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Project Content */}
        {!isLoading && !error && project && (
          <div className="space-y-8">
            {/* Project Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {project.name}
                  </h2>
                  <p className="text-gray-400">Your AI-powered resume project</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Created</span>
                  </div>
                  <p className="text-lg font-medium text-white">{formatDate(project.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Last Updated</span>
                  </div>
                  <p className="text-lg font-medium text-white">{formatDate(project.updatedAt)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <GitBranch className="w-4 h-4" />
                    <span>Versions</span>
                  </div>
                  <p className="text-lg font-medium text-white">{project.versionCount}</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">What would you like to do?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Editor Link */}
                {versions.length > 0 ? (
                  <Link href={`/projects/${projectId}/editor?versionId=${versions[0].versionId}`}>
                    <div className="group cursor-pointer h-full p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:bg-gray-900/70 hover:border-blue-500/30 transition-all">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                        <FileCode className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        Resume Editor
                      </h3>
                      <p className="text-gray-400 mb-4 text-sm">
                        Edit resume versions, view LaTeX, and compile to PDF
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-xs text-gray-500">
                          {versions.length} version{versions.length !== 1 ? 's' : ''}
                        </span>
                        <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="opacity-60 p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10">
                    <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                      <FileCode className="w-7 h-7 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      Resume Editor
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      No versions available yet
                    </p>
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                      <AlertCircle className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600">
                        Try refreshing the page
                      </span>
                    </div>
                  </div>
                )}

                {/* Job Descriptions Link */}
                <Link href={`/projects/${projectId}/jd`}>
                  <div className="group cursor-pointer h-full p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:bg-gray-900/70 hover:border-purple-500/30 transition-all">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                      <Briefcase className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      Job Descriptions
                    </h3>
                    <p className="text-gray-400 mb-4 text-sm">
                      View all saved job descriptions for this project
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs text-gray-500">Manage JDs</span>
                      <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>

                {/* AI Jobs Link */}
                <Link href={`/projects/${projectId}/ai-jobs`}>
                  <div className="group cursor-pointer h-full p-6 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:bg-gray-900/70 hover:border-emerald-500/30 transition-all">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      AI Jobs
                    </h3>
                    <p className="text-gray-400 mb-4 text-sm">
                      Track AI tailoring jobs and status
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs text-gray-500">View status</span>
                      <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

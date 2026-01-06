'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { FadeIn, SlideUp } from '@/components/ui/Animated';
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
    <div className="min-h-screen bg-dark-950">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-dark-300 hover:text-white transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <h1 className="text-xl font-bold">
              {project ? project.name : 'Project Details'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <FadeIn>
            <GlassCard>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
                <span className="ml-4 text-dark-300">Loading project...</span>
              </div>
            </GlassCard>
          </FadeIn>
        )}

        {/* Error State */}
        {error && (
          <SlideUp>
            <GlassCard className="bg-red-500/10 border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-300 mb-1">Error</p>
                  <p className="text-sm text-red-200">{error}</p>
                  {error === 'Project not found' && (
                    <div className="mt-4">
                      <Link href="/dashboard">
                        <Button variant="secondary">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Dashboard
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </SlideUp>
        )}

        {/* Project Content */}
        {!isLoading && !error && project && (
          <div className="space-y-8">
            {/* Project Info Card */}
            <SlideUp>
              <GlassCard>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      {project.name}
                    </h2>
                    <p className="text-dark-400">Your AI-powered resume project</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-dark-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Created</span>
                    </div>
                    <p className="text-lg font-medium">{formatDate(project.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-dark-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Last Updated</span>
                    </div>
                    <p className="text-lg font-medium">{formatDate(project.updatedAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-dark-400 text-sm">
                      <GitBranch className="w-4 h-4" />
                      <span>Versions</span>
                    </div>
                    <p className="text-lg font-medium">{project.versionCount}</p>
                  </div>
                </div>
              </GlassCard>
            </SlideUp>

            {/* Quick Actions */}
            <SlideUp delay={0.1}>
              <div>
                <h3 className="text-xl font-bold mb-4">What would you like to do?</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Editor Link */}
                  {versions.length > 0 ? (
                    <Link href={`/projects/${projectId}/editor?versionId=${versions[0].versionId}`}>
                      <GlassCard className="group cursor-pointer h-full hover:shadow-glow">
                        <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <FileCode className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                          Resume Editor
                        </h3>
                        <p className="text-dark-400 mb-4 text-sm">
                          Edit resume versions, view LaTeX, and compile to PDF
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <span className="text-xs text-dark-500">
                            {versions.length} version{versions.length !== 1 ? 's' : ''}
                          </span>
                          <ArrowRight className="w-5 h-5 text-primary-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </GlassCard>
                    </Link>
                  ) : (
                    <GlassCard className="opacity-60">
                      <div className="w-14 h-14 bg-gradient-to-br from-dark-700 to-dark-600 rounded-xl flex items-center justify-center mb-4">
                        <FileCode className="w-7 h-7 text-dark-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-dark-400">
                        Resume Editor
                      </h3>
                      <p className="text-dark-500 mb-4 text-sm">
                        No versions available yet
                      </p>
                      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                        <AlertCircle className="w-4 h-4 text-dark-500" />
                        <span className="text-xs text-dark-500">
                          Try refreshing the page
                        </span>
                      </div>
                    </GlassCard>
                  )}

                  {/* Job Descriptions Link */}
                  <Link href={`/projects/${projectId}/jd`}>
                    <GlassCard className="group cursor-pointer h-full hover:shadow-glow-secondary">
                      <div className="w-14 h-14 bg-gradient-secondary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Briefcase className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-secondary-400 transition-colors">
                        Job Descriptions
                      </h3>
                      <p className="text-dark-400 mb-4 text-sm">
                        View all saved job descriptions for this project
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-xs text-dark-500">Manage JDs</span>
                        <ArrowRight className="w-5 h-5 text-secondary-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </GlassCard>
                  </Link>

                  {/* AI Jobs Link */}
                  <Link href={`/projects/${projectId}/ai-jobs`}>
                    <GlassCard className="group cursor-pointer h-full hover:bg-accent-500/10">
                      <div className="w-14 h-14 bg-gradient-accent rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-accent-400 transition-colors">
                        AI Jobs
                      </h3>
                      <p className="text-dark-400 mb-4 text-sm">
                        Track AI tailoring jobs and status
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-xs text-dark-500">View status</span>
                        <ArrowRight className="w-5 h-5 text-accent-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </GlassCard>
                  </Link>
                </div>
              </div>
            </SlideUp>
          </div>
        )}
      </main>
    </div>
  );
}

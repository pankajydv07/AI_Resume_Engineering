'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';
import { ArrowLeft, Zap, Calendar, Clock, ExternalLink, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  jobId: string;
  projectId: string;
  jdId: string;
  baseVersionId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
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
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl(`/api/ai/jobs/project/${projectId}`), {
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED': 
        return { 
          bg: 'bg-emerald-500/20', 
          text: 'text-emerald-400', 
          icon: CheckCircle 
        };
      case 'RUNNING': 
        return { 
          bg: 'bg-blue-500/20', 
          text: 'text-blue-400', 
          icon: Loader2 
        };
      case 'QUEUED': 
        return { 
          bg: 'bg-yellow-500/20', 
          text: 'text-yellow-400', 
          icon: Clock 
        };
      case 'FAILED': 
        return { 
          bg: 'bg-red-500/20', 
          text: 'text-red-400', 
          icon: XCircle 
        };
      default: 
        return { 
          bg: 'bg-gray-500/20', 
          text: 'text-gray-400', 
          icon: AlertCircle 
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header with Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
            <span>›</span>
            <Link href={`/projects/${projectId}`} className="hover:text-white transition">
              Project
            </Link>
            <span>›</span>
            <span className="text-white">AI Jobs</span>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h1 className="text-2xl font-bold text-white">AI Tailoring Jobs</h1>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-8"
          >
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-4 text-gray-300">Loading AI jobs...</span>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 mb-6"
          >
            <p className="text-sm text-red-300">
              <strong>Error:</strong> {error}
            </p>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && aiJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No AI Jobs Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              AI tailoring jobs are created when you request the AI to optimize your resume for a specific job description.
            </p>
            
            <div className="mb-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-lg mx-auto text-left">
              <p className="font-medium text-blue-300 mb-3">Prerequisites:</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Have a base resume version loaded in the editor
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Add at least one job description via the JD panel
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Click "Tailor to JD" in the editor to start AI processing
                </li>
              </ul>
            </div>
            
            <Link
              href={`/projects/${projectId}/editor`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Editor
            </Link>
          </motion.div>
        )}

        {/* AI Jobs List */}
        {!isLoading && !error && aiJobs.length > 0 && (
          <div className="space-y-4">
            {aiJobs.map((job, index) => {
              const statusConfig = getStatusConfig(job.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={job.jobId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                        statusConfig.bg,
                        statusConfig.text
                      )}>
                        <StatusIcon className={cn("w-3 h-3", job.status === 'RUNNING' && "animate-spin")} />
                        {job.status}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {job.jobId.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Created</span>
                      <p className="text-gray-300 mt-1">{formatDate(job.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Updated</span>
                      <p className="text-gray-300 mt-1">{formatDate(job.updatedAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Base Version</span>
                      <p className="text-gray-300 font-mono mt-1">{job.baseVersionId.substring(0, 8)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider">Job Description</span>
                      <p className="text-gray-300 font-mono mt-1">{job.jdId.substring(0, 8)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

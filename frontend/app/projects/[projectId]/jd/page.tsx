'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';
import { ArrowLeft, FileText, Calendar, ExternalLink, Briefcase } from 'lucide-react';

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
  const { getToken } = useAuth();
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
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl(`/api/jd/project/${projectId}`), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const data: JobDescription[] = await response.json();
      setJds(data);
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

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
            <span className="text-white">Job Descriptions</span>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Job Descriptions</h1>
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
              <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-4 text-gray-300">Loading job descriptions...</span>
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
        {!isLoading && !error && jds.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Job Descriptions Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Job descriptions are used to tailor your resume for specific positions. Add them from the editor's JD panel.
            </p>
            <Link
              href={`/projects/${projectId}/editor`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Editor
            </Link>
          </motion.div>
        )}

        {/* JD List */}
        {!isLoading && !error && jds.length > 0 && (
          <div className="space-y-4">
            {jds.map((jd, index) => (
              <motion.div
                key={jd.jdId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Added: {formatDate(jd.createdAt)}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                    {jd.jdId.substring(0, 8)}
                  </span>
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {truncateText(jd.rawText)}
                </div>
                {jd.rawText.length > 150 && (
                  <button className="mt-3 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    View Full Description
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

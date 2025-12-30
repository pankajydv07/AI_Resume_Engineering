'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EditorWorkspace } from './components/EditorWorkspace';

/**
 * PHASE 3: Resume Editor Page
 * PHASE 7.2: Added breadcrumbs for navigation clarity
 * Route: /projects/:projectId/editor?versionId=xxx
 * 
 * Per userflow.md Section 2.5:
 * - Layout: LEFT (LaTeX Editor) | RIGHT (PDF Preview)
 * - Purpose: Manual resume editing, version switching
 * - Allowed: Edit in memory, save manual changes, switch versions
 * - Forbidden: AI auto-run, silent overwrites
 * 
 * FIXED: Read versionId from URL search params instead of trying to fetch by projectId
 */
export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const versionId = searchParams.get('versionId');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PHASE 7.2: Breadcrumbs for navigation clarity */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-2">
          <nav className="flex items-center text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Dashboard
            </Link>
            <span className="mx-2">›</span>
            <Link href={`/projects/${projectId}`} className="hover:text-gray-900 transition">
              Project
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">Editor</span>
          </nav>
        </div>
      </div>
      <EditorWorkspace projectId={projectId} initialVersionId={versionId} />
    </div>
  );
}

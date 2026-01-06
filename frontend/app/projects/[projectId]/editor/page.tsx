'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { EditorWorkspace } from './components/EditorWorkspace';

/**
 * PHASE 3: Resume Editor Page
 * REDESIGNED: Unified compact header with glassmorphism
 * Route: /projects/:projectId/editor?versionId=xxx
 * 
 * Per userflow.md Section 2.5:
 * - Layout: LEFT (LaTeX Editor) | RIGHT (PDF Preview)
 * - Purpose: Manual resume editing, version switching
 * - Allowed: Edit in memory, save manual changes, switch versions
 * - Forbidden: AI auto-run, silent overwrites
 * 
 * Header redesign removes separate breadcrumb bar - back navigation 
 * is now integrated into the unified header bar.
 */
export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const versionId = searchParams.get('versionId');

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Background gradient accents */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/5 rounded-full blur-3xl" />
      </div>
      
      <EditorWorkspace projectId={projectId} initialVersionId={versionId} />
    </div>
  );
}

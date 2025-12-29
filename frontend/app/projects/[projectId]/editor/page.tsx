'use client';

import { useParams } from 'next/navigation';
import { EditorWorkspace } from './components/EditorWorkspace';

/**
 * PHASE 3: Resume Editor Page
 * Route: /projects/:projectId/editor
 * 
 * Per userflow.md Section 2.5:
 * - Layout: LEFT (LaTeX Editor) | RIGHT (PDF Preview)
 * - Purpose: Manual resume editing, version switching
 * - Allowed: Edit in memory, save manual changes, switch versions
 * - Forbidden: AI auto-run, silent overwrites
 */
export default function EditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <EditorWorkspace projectId={projectId} />
    </div>
  );
}

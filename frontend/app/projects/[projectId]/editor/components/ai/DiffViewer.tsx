'use client';

import { MonacoDiffViewer } from './MonacoDiffViewer';

/**
 * PHASE 6: Diff Viewer Component
 * GOAL 4: Updated to use Monaco diff editor
 * 
 * Displays inline diff between base and proposed resume
 * VS Code-style with Monaco editor
 * 
 * Requirements:
 * - Clear additions/removals
 * - Read-only view
 * - No editing
 * 
 * Forbidden:
 * - No accept-by-default
 * - No inline editing
 */

interface DiffViewerProps {
  baseContent: string;
  proposedContent: string;
  baseLabel?: string;
  proposedLabel?: string;
}

export function DiffViewer({
  baseContent,
  proposedContent,
  baseLabel = 'Base Resume',
  proposedLabel = 'AI Proposal',
}: DiffViewerProps) {
  return (
    <div className="w-full h-full">
      <MonacoDiffViewer
        originalContent={baseContent}
        modifiedContent={proposedContent}
        originalLabel={baseLabel}
        modifiedLabel={proposedLabel}
        language="latex"
        readOnly={true}
      />
    </div>
  );
}

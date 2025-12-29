'use client';

import { useMemo } from 'react';

/**
 * PHASE 6: Diff Viewer Component
 * 
 * Displays side-by-side diff between base and proposed resume
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

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

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
  // Simple line-based diff computation
  const { baseLines, proposedLines } = useMemo(() => {
    const base = baseContent.split('\n');
    const proposed = proposedContent.split('\n');

    const baseDiff: DiffLine[] = [];
    const proposedDiff: DiffLine[] = [];

    // Simple comparison (exact match)
    // TODO: Replace with actual diff algorithm for better UX
    const maxLength = Math.max(base.length, proposed.length);

    for (let i = 0; i < maxLength; i++) {
      const baseLine = base[i];
      const proposedLine = proposed[i];

      if (baseLine !== undefined && proposedLine !== undefined) {
        if (baseLine === proposedLine) {
          // Unchanged line
          baseDiff.push({
            type: 'unchanged',
            content: baseLine,
            lineNumber: i + 1,
          });
          proposedDiff.push({
            type: 'unchanged',
            content: proposedLine,
            lineNumber: i + 1,
          });
        } else {
          // Changed line (shown as removed + added)
          baseDiff.push({
            type: 'removed',
            content: baseLine,
            lineNumber: i + 1,
          });
          proposedDiff.push({
            type: 'added',
            content: proposedLine,
            lineNumber: i + 1,
          });
        }
      } else if (baseLine !== undefined) {
        // Line removed in proposed
        baseDiff.push({
          type: 'removed',
          content: baseLine,
          lineNumber: i + 1,
        });
      } else if (proposedLine !== undefined) {
        // Line added in proposed
        proposedDiff.push({
          type: 'added',
          content: proposedLine,
          lineNumber: i + 1,
        });
      }
    }

    return { baseLines: baseDiff, proposedLines: proposedDiff };
  }, [baseContent, proposedContent]);

  const renderDiffLine = (line: DiffLine) => {
    const bgColor =
      line.type === 'added'
        ? 'bg-green-50'
        : line.type === 'removed'
        ? 'bg-red-50'
        : 'bg-white';

    const textColor =
      line.type === 'added'
        ? 'text-green-900'
        : line.type === 'removed'
        ? 'text-red-900'
        : 'text-gray-800';

    const marker =
      line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  ';

    return (
      <div
        key={`${line.type}-${line.lineNumber}-${line.content.substring(0, 20)}`}
        className={`flex font-mono text-xs ${bgColor} ${textColor} border-b border-gray-100`}
      >
        <div className="w-12 flex-shrink-0 text-right pr-2 text-gray-400 select-none">
          {line.lineNumber}
        </div>
        <div className="w-6 flex-shrink-0 text-gray-500 select-none">{marker}</div>
        <div className="flex-1 whitespace-pre-wrap break-all px-2 py-1">
          {line.content || ' '}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Resume Diff Viewer</h3>
        <p className="text-xs text-gray-500 mt-1">
          Read-only comparison. No changes will be applied automatically.
        </p>
      </div>

      {/* Side-by-side diff */}
      <div className="flex">
        {/* Left: Base Resume */}
        <div className="w-1/2 border-r border-gray-200">
          <div className="bg-red-100 border-b border-red-200 px-4 py-2">
            <div className="text-xs font-medium text-red-800">{baseLabel}</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {baseLines.map((line, idx) => (
              <div key={idx}>{renderDiffLine(line)}</div>
            ))}
          </div>
        </div>

        {/* Right: Proposed Resume */}
        <div className="w-1/2">
          <div className="bg-green-100 border-b border-green-200 px-4 py-2">
            <div className="text-xs font-medium text-green-800">{proposedLabel}</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {proposedLines.map((line, idx) => (
              <div key={idx}>{renderDiffLine(line)}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with stats */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="text-xs text-gray-600 flex gap-4">
          <span className="text-green-700">
            +{proposedLines.filter((l) => l.type === 'added').length} additions
          </span>
          <span className="text-red-700">
            -{baseLines.filter((l) => l.type === 'removed').length} deletions
          </span>
          <span className="text-gray-500">
            {baseLines.filter((l) => l.type === 'unchanged').length} unchanged
          </span>
        </div>
      </div>
    </div>
  );
}

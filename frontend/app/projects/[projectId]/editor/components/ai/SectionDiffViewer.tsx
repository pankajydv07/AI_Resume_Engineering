'use client';

import { SectionProposal, SectionType } from './ProposalModal';
import { MonacoDiffViewer } from './MonacoDiffViewer';

/**
 * GOAL 4: Section-level diff viewer
 * 
 * Displays before/after comparison for individual resume sections
 * VS Code-style inline diff with Monaco editor
 */

interface SectionDiffViewerProps {
  proposal: SectionProposal;
  isAccepted: boolean;
  onToggle: (sectionType: SectionType) => void;
}

export function SectionDiffViewer({ proposal, isAccepted, onToggle }: SectionDiffViewerProps) {
  const { sectionType, before, after, changeType } = proposal;

  // Format section type for display
  const formatSectionType = (type: SectionType): string => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const sectionLabel = formatSectionType(sectionType);
  const hasChanges = changeType === 'modified';

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Section Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        hasChanges ? 'bg-blue-50 border-b border-blue-200' : 'bg-gray-50 border-b border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-900">{sectionLabel}</span>
          {!hasChanges && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
              No changes
            </span>
          )}
          {hasChanges && (
            <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
              Modified
            </span>
          )}
        </div>

        {hasChanges && (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAccepted}
              onChange={() => onToggle(sectionType)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Accept changes</span>
          </label>
        )}
      </div>

      {/* Diff Content */}
      {hasChanges ? (
        <div className="h-96 border-t border-gray-200">
          <MonacoDiffViewer
            originalContent={before}
            modifiedContent={after}
            originalLabel={`Current ${sectionLabel}`}
            modifiedLabel={`Proposed ${sectionLabel}`}
            language="latex"
            readOnly={true}
          />
        </div>
      ) : (
        <div className="p-4 bg-gray-50">
          <pre className="text-xs font-mono whitespace-pre-wrap text-gray-600 overflow-auto max-h-32">
            {before}
          </pre>
        </div>
      )}
    </div>
  );
}

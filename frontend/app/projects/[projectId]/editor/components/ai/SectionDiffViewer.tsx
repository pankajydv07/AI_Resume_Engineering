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
    <div className="glass-card border border-white/10 rounded-xl overflow-hidden shadow-glass hover:border-white/20 transition-all duration-200">
      {/* Section Header - Dark theme */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${
        hasChanges 
          ? 'border-primary-500/30 bg-gradient-to-r from-primary-500/10 to-secondary-500/10' 
          : 'border-white/10 bg-dark-900/50'
      }`}>
        <div className="flex items-center space-x-3">
          {/* Icon based on section type */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            hasChanges ? 'bg-gradient-primary shadow-glow' : 'bg-dark-800 border border-white/10'
          }`}>
            <svg className={`w-6 h-6 ${hasChanges ? 'text-white' : 'text-dark-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-dark-100 text-lg">{sectionLabel}</span>
            {!hasChanges && (
              <span className="ml-2 text-xs bg-dark-800 text-dark-400 px-3 py-1 rounded-full font-medium border border-white/10">
                ✓ No changes
              </span>
            )}
            {hasChanges && (
              <span className="ml-2 text-xs bg-gradient-primary text-white px-3 py-1 rounded-full font-medium shadow-glow">
                ⚡ Modified
              </span>
            )}
          </div>
        </div>

        {hasChanges && (
          <label className="flex items-center space-x-3 cursor-pointer group">
            <span className="text-sm text-dark-300 font-medium group-hover:text-primary-400 transition-colors">
              {isAccepted ? 'Accepted' : 'Accept changes'}
            </span>
            <input
              type="checkbox"
              checked={isAccepted}
              onChange={() => onToggle(sectionType)}
              className="w-5 h-5 text-primary-500 bg-dark-800 border-white/20 rounded focus:ring-2 focus:ring-primary-500 cursor-pointer"
            />
          </label>
        )}
      </div>

      {/* Diff Content - Dark theme */}
      {hasChanges ? (
        <div className="h-96 bg-dark-950">
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
        <div className="p-6 bg-dark-900">
          <div className="glass-card p-4 rounded-lg border border-white/10">
            <pre className="text-sm font-mono whitespace-pre-wrap text-dark-300 overflow-auto max-h-32">
              {before}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

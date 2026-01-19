'use client';

import { motion } from 'framer-motion';
import { FileText, Check, Zap, CheckCircle2 } from 'lucide-react';
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-all duration-200"
    >
      {/* Section Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${
        hasChanges 
          ? 'border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-indigo-500/10' 
          : 'border-gray-700/50 bg-gray-900/50'
      }`}>
        <div className="flex items-center space-x-3">
          {/* Icon based on section type */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            hasChanges ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20' : 'bg-gray-800 border border-gray-700'
          }`}>
            <FileText className={`w-5 h-5 ${hasChanges ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <div>
            <span className="font-bold text-white text-lg">{sectionLabel}</span>
            {!hasChanges && (
              <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full font-medium border border-gray-700 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> No changes
              </span>
            )}
            {hasChanges && (
              <span className="ml-2 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full font-medium shadow-lg inline-flex items-center gap-1">
                <Zap className="w-3 h-3" /> Modified
              </span>
            )}
          </div>
        </div>

        {hasChanges && (
          <label className="flex items-center space-x-3 cursor-pointer group">
            <span className="text-sm text-gray-400 font-medium group-hover:text-blue-400 transition-colors">
              {isAccepted ? 'Accepted' : 'Accept changes'}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={isAccepted}
                onChange={() => onToggle(sectionType)}
                className="sr-only"
              />
              <motion.div
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  isAccepted 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500' 
                    : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => onToggle(sectionType)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isAccepted && <CheckCircle2 className="w-4 h-4 text-white" />}
              </motion.div>
            </div>
          </label>
        )}
      </div>

      {/* Diff Content */}
      {hasChanges ? (
        <div className="h-96 bg-gray-950">
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
        <div className="p-6 bg-gray-950">
          <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700/50">
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-400 overflow-auto max-h-32">
              {before}
            </pre>
          </div>
        </div>
      )}
    </motion.div>
  );
}

'use client';

import { useState } from 'react';
import { JdInput } from './JdInput';
import { JdList } from './JdList';
import { AiJobButton } from '../ai/AiJobButton';

/**
 * PHASE 4: JD Management Panel
 * PHASE 5: AI Job Trigger (added)
 * PHASE 6: Enhanced with version change callback
 * 
 * Manages JD state completely separate from resume editor state
 * 
 * State:
 * - selectedJdId: Currently selected JD (state only, no side effects)
 * - refreshTrigger: Trigger to reload list after submission
 * 
 * Per requirements:
 * - Selection must NOT trigger resume modification
 * - Selection must NOT trigger AI job
 * - Selection must NOT trigger version creation
 * 
 * This selection exists ONLY for future phases.
 */

interface JdPanelProps {
  projectId: string;
  baseVersionId: string | null;
  baseLatexContent: string;
  onVersionChange: (newVersionId: string) => void;
}

export function JdPanel({ projectId, baseVersionId, baseLatexContent, onVersionChange }: JdPanelProps) {
  const [selectedJdId, setSelectedJdId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleJdSubmitted = (jdId: string) => {
    // Refresh list after new JD is submitted
    setRefreshTrigger(prev => prev + 1);
    
    // Auto-select the newly submitted JD
    setSelectedJdId(jdId);
  };

  const handleJdSelected = (jdId: string) => {
    // Update selection (state only, no side effects)
    setSelectedJdId(jdId);

    // CRITICAL: This must NOT trigger:
    // - Resume modification
    // - AI job
    // - Version creation
    // Selection exists ONLY for future phases
  };

  return (
    <div className="flex flex-col h-full">
      {/* PHASE 7.2: Section Header with Helper Text */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Job Descriptions</h2>
        <p className="text-xs text-gray-500">
          Add job descriptions to tailor your resume for specific positions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* JD Input */}
        <JdInput 
          projectId={projectId} 
          onJdSubmitted={handleJdSubmitted}
        />

        {/* JD List */}
        <JdList
          projectId={projectId}
          selectedJdId={selectedJdId}
          onJdSelected={handleJdSelected}
          refreshTrigger={refreshTrigger}
        />

        {/* PHASE 7.2: AI Tailoring Section Header */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Tailoring</h3>
          <p className="text-xs text-gray-500 mb-3">
            Generate AI-optimized resume versions based on selected job descriptions.
          </p>
          
          {/* PHASE 5: AI Job Button */}
          {/* PHASE 6: Enhanced with proposal workflow */}
          <AiJobButton
            projectId={projectId}
            baseVersionId={baseVersionId}
            selectedJdId={selectedJdId}
            baseLatexContent={baseLatexContent}
            onVersionChange={onVersionChange}
          />
        </div>
      </div>
    </div>
  );
}

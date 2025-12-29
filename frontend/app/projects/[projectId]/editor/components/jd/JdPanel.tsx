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
    <div className="space-y-4">
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
  );
}

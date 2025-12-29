'use client';

import { useState } from 'react';
import { ProposalModal } from './ProposalModal';

/**
 * PHASE 5: AI Job Button Component
 * PHASE 6: Enhanced with proposal viewing
 * PHASE 7.2: Button gating with helper text
 * 
 * Triggers AI tailoring job and displays status
 * Shows proposal modal when job completes
 * 
 * Per apis.md Section 6:
 * - POST /api/ai/tailor to start job
 * - GET /api/ai/jobs/{jobId} to poll status
 * 
 * PHASE 6: Proposal viewing
 * - Shows ProposalModal when status = COMPLETED
 * - Handles accept/reject actions
 * 
 * PHASE 7.2: UI Gating Rules
 * - "Start AI Tailoring" disabled if no baseVersionId OR no selectedJdId
 * - Helper text explains prerequisites
 * - "Review Proposal" only visible when status = COMPLETED
 */

interface AiJobButtonProps {
  projectId: string;
  baseVersionId: string | null;
  selectedJdId: string | null;
  baseLatexContent: string;
  onVersionChange: (newVersionId: string) => void;
}

export function AiJobButton({ 
  projectId, 
  baseVersionId, 
  selectedJdId,
  baseLatexContent,
  onVersionChange,
}: AiJobButtonProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [showProposal, setShowProposal] = useState(false);

  const canStart = baseVersionId && selectedJdId && !jobId;

  const startAiJob = async () => {
    if (!canStart) return;

    setIsStarting(true);
    setErrorMessage(null);

    try {
      // TODO: Replace with real Clerk token when auth is implemented
      const response = await fetch('http://localhost:3001/api/ai/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token-user-123',
        },
        body: JSON.stringify({
          projectId,
          baseVersionId,
          jdId: selectedJdId,
          mode: 'BALANCED',
          lockedSections: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start AI job: ${response.statusText}`);
      }

      const result = await response.json();
      setJobId(result.jobId);
      setStatus('QUEUED');

      // Start polling
      pollJobStatus(result.jobId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsStarting(false);
    }
  };

  const pollJobStatus = async (id: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/ai/jobs/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token-user-123',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get job status: ${response.statusText}`);
        }

        const result = await response.json();
        setStatus(result.status);
        setErrorMessage(result.errorMessage);

        // PHASE 7.2: Only show proposal modal automatically on first completion
        // User can click "Review Proposal" button to re-open if closed
        if (result.status === 'COMPLETED' && !showProposal) {
          setShowProposal(true);
          return;
        }

        // Continue polling if not complete
        if (result.status === 'QUEUED' || result.status === 'RUNNING') {
          setTimeout(() => poll(), 2000); // Poll every 2 seconds
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    poll();
  };

  const resetJob = () => {
    setJobId(null);
    setStatus(null);
    setErrorMessage(null);
    setShowProposal(false);
  };

  const handleProposalAccepted = (newVersionId: string) => {
    onVersionChange(newVersionId);
    resetJob();
  };

  const handleProposalRejected = () => {
    resetJob();
  };

  // PHASE 7.2: Determine why button is disabled for helper text
  const getDisabledReason = (): string | null => {
    if (!baseVersionId && !selectedJdId) {
      return 'Load a resume version and select a job description to start AI tailoring';
    }
    if (!baseVersionId) {
      return 'Load a resume version using the version selector above';
    }
    if (!selectedJdId) {
      return 'Select a job description from the list';
    }
    return null;
  };

  const disabledReason = getDisabledReason();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* PHASE 7.2: Prerequisites Helper Text */}
      {disabledReason && !jobId && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 font-bold">ⓘ</span>
            <div>
              <div className="font-medium mb-1">Prerequisites Required</div>
              <div className="text-xs">{disabledReason}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* Status Display */}
      {status && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Job Status</div>
          <div className={`text-sm font-medium ${
            status === 'COMPLETED' ? 'text-green-600' :
            status === 'FAILED' ? 'text-red-600' :
            status === 'RUNNING' ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            {status === 'QUEUED' && '⏳ Queued'}
            {status === 'RUNNING' && '▶ Running'}
            {status === 'COMPLETED' && '✓ Completed'}
            {status === 'FAILED' && '✗ Failed'}
          </div>
          {jobId && (
            <div className="text-xs text-gray-400 mt-1">
              Job ID: {jobId.substring(0, 8)}...
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!jobId ? (
        /* PHASE 7.2: Start AI Tailoring button with gating */
        <button
          type="button"
          onClick={startAiJob}
          disabled={!canStart || isStarting}
          title={disabledReason || undefined}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isStarting ? 'Starting...' : 'Start AI Tailoring'}
        </button>
      ) : status === 'COMPLETED' ? (
        /* PHASE 7.2: Review Proposal - only visible when COMPLETED */
        <button
          type="button"
          onClick={() => setShowProposal(true)}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
        >
          Review Proposal
        </button>
      ) : status === 'FAILED' ? (
        /* Failed - allow starting new job */
        <button
          type="button"
          onClick={resetJob}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Start New Job
        </button>
      ) : (
        /* In progress - show disabled button */
        <button
          type="button"
          disabled
          className="w-full px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded cursor-not-allowed"
        >
          {status === 'QUEUED' ? 'Queued...' : 'Processing...'}
        </button>
      )}

      {/* Phase Notice */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          PHASE 7.2: Button gating with helper text. Review proposal only shown when complete.
        </div>
      </div>

      {/* PHASE 7.2: Proposal Modal - only when explicitly opened */}
      {showProposal && jobId && baseVersionId && status === 'COMPLETED' && (
        <ProposalModal
          aiJobId={jobId}
          projectId={projectId}
          baseVersionId={baseVersionId}
          baseLatexContent={baseLatexContent}
          onAccepted={handleProposalAccepted}
          onRejected={handleProposalRejected}
          onClose={() => setShowProposal(false)}
        />
      )}
    </div>
  );
}

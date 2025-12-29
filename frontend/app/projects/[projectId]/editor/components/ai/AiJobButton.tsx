'use client';

import { useState } from 'react';
import { ProposalModal } from './ProposalModal';

/**
 * PHASE 5: AI Job Button Component
 * PHASE 6: Enhanced with proposal viewing
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

        // If completed, show proposal modal
        if (result.status === 'COMPLETED') {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        AI Tailoring
      </h3>

      {/* Prerequisites Check */}
      {!baseVersionId && (
        <div className="text-sm text-amber-600 mb-3">
          ⚠ No resume version loaded
        </div>
      )}
      {!selectedJdId && (
        <div className="text-sm text-amber-600 mb-3">
          ⚠ No job description selected
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="text-sm text-red-600 mb-3">
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

      {/* Action Button */}
      {!jobId ? (
        <button
          type="button"
          onClick={startAiJob}
          disabled={!canStart || isStarting}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isStarting ? 'Starting...' : 'Start AI Tailoring'}
        </button>
      ) : (
        <button
          type="button"
          onClick={resetJob}
          disabled={status === 'QUEUED' || status === 'RUNNING'}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'QUEUED' || status === 'RUNNING' ? 'In Progress...' : 'Start New Job'}
        </button>
      )}

      {/* Phase Notice */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          PHASE 6: AI proposal workflow. Explicit acceptance required.
        </div>
      </div>

      {/* Proposal Modal */}
      {showProposal && jobId && baseVersionId && (
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

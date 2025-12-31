'use client';

import { useState, useEffect, useRef } from 'react';
import { ProposalModal } from './ProposalModal';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';

/**
 * PHASE 5: AI Job Button Component
 * PHASE 6: Enhanced with proposal viewing
 * PHASE 7.2: Button gating with helper text
 * PHASE 7.3: Robustness - refresh behavior & lifecycle hardening
 * 
 * WHY THIS COMPONENT EXISTS:
 * AI is powerful but not trustworthy by default. This component enforces the trust boundary:
 * AI output never directly modifies user data. Instead, AI creates a PROPOSAL (ProposedVersion)
 * which remains quarantined until the user explicitly reviews and accepts it.
 * 
 * WHY POLLING:
 * AI processing takes time (seconds to minutes). Polling keeps the UI responsive and allows
 * users to navigate away and return. The job persists on the backend; polling just syncs UI state.
 * 
 * WHY NO AUTO-ACCEPTANCE:
 * Users must see the diff and click "Accept". No silent updates. This is the core safety guarantee.
 * Even if the AI job completes, the proposal stays in limbo until explicit user consent.
 * 
 * PHASE 7.3: Refresh Behavior
 * - Component state (jobId, status, polling) resets on refresh
 * - This is EXPECTED - job data persists on backend
 * - User can view all jobs on /projects/{projectId}/ai-jobs page
 * - No stuck UI states - component always starts fresh
 */

interface AiJobButtonProps {
  projectId: string;
  baseVersionId: string | null;
  selectedJdId: string | null;
  baseLatexContent: string;
  onVersionChange: (newVersionId: string) => void;
  getToken: () => Promise<string | null>;
}

export function AiJobButton({ 
  projectId, 
  baseVersionId, 
  selectedJdId,
  baseLatexContent,
  onVersionChange,
  getToken,
}: AiJobButtonProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  
  // PHASE 7.3: Ref to track polling timeout for cleanup
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // PHASE 7.3: Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  const canStart = baseVersionId && selectedJdId && !jobId;

  const startAiJob = async () => {
    if (!canStart) return;

    setIsStarting(true);
    setErrorMessage(null);

    try {
      // PHASE 8: Real Clerk JWT authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl('/api/ai/tailor'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();
      setJobId(result.jobId);
      setStatus('QUEUED');

      // Start polling
      pollJobStatus(result.jobId);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  };

  const pollJobStatus = async (id: string) => {
    // PHASE 7.3: Set polling state
    setIsPolling(true);

    const poll = async () => {
      try {
        const token = await getToken();
        
        if (!token) {
          setIsPolling(false);
          setErrorMessage('Not authenticated');
          return;
        }

        const response = await fetch(apiUrl(`/api/ai/jobs/${id}`), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorInfo = await handleHttpError(response);
          throw errorInfo;
        }

        const result = await response.json();
        setStatus(result.status);
        setErrorMessage(result.errorMessage);

        // PHASE 7.2: Only show proposal modal automatically on first completion
        // User can click "Review Proposal" button to re-open if closed
        if (result.status === 'COMPLETED' && !showProposal) {
          setIsPolling(false);
          setShowProposal(true);
          return;
        }

        // PHASE 7.3: Stop polling on FAILED state
        if (result.status === 'FAILED') {
          setIsPolling(false);
          return;
        }

        // Continue polling if not complete
        if (result.status === 'QUEUED' || result.status === 'RUNNING') {
          // PHASE 7.3: Store timeout ref for cleanup
          pollingTimeoutRef.current = setTimeout(() => poll(), 2000);
        } else {
          setIsPolling(false);
        }
      } catch (err) {
        setErrorMessage(getErrorMessage(err));
        setIsPolling(false);
      }
    };

    poll();
  };

  const resetJob = () => {
    // PHASE 7.3: Clear polling timeout if active
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setJobId(null);
    setStatus(null);
    setErrorMessage(null);
    setIsPolling(false);
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
          <div className="flex items-center gap-2">
            {/* PHASE 7.3: Loading indicator while polling */}
            {isPolling && (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent" />
            )}
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
        /* PHASE 7.3: Failed state - allow retry with clear button */
        <button
          type="button"
          onClick={resetJob}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700 transition-colors"
        >
          ↻ Retry AI Tailoring
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
          PHASE 7.3: Lifecycle hardening - polling cleanup, loading state, graceful error handling.
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
          getToken={getToken}
        />
      )}
    </div>
  );
}

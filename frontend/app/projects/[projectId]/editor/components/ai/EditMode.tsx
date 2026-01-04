'use client';

import { useState, useEffect, useRef } from 'react';
import { ProposalModal } from './ProposalModal';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';

/**
 * EDIT MODE — CANVAS-STYLE AI EDITING
 * 
 * Single instruction input that triggers existing AI proposal flow.
 * Inspired by GPT Canvas, but SAFE:
 * - AI output goes to ProposedVersion (not applied directly)
 * - User sees diff + must explicitly Accept/Reject
 * - Resume content never mutated by AI
 * 
 * Examples:
 * - "Rewrite experience to match backend engineer role"
 * - "Quantify achievements where possible"
 * - "Make the summary more concise"
 * 
 * Uses existing:
 * - /api/ai/tailor endpoint
 * - ProposalModal for diff review
 * - Versioning system
 */

interface EditModeProps {
  projectId: string;
  baseVersionId: string | null;
  baseLatexContent: string;
  jdId: string | null; // Use JD ID instead of raw text
  isLocked: boolean;
  onVersionChange: (newVersionId: string) => void;
  getToken: () => Promise<string | null>;
  onOpenJdModal: () => void;
  hasJd: boolean;
  isLoadingJds: boolean;
  jdError: string | null;
  onRemoveJd: () => void;
}

export function EditMode({
  projectId,
  baseVersionId,
  baseLatexContent,
  jdId,
  isLocked,
  onVersionChange,
  getToken,
  onOpenJdModal,
  hasJd,
  isLoadingJds,
  jdError,
  onRemoveJd,
}: EditModeProps) {
  const [instruction, setInstruction] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  const canSubmit = baseVersionId && instruction.trim() && !jobId && !isLocked;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsStarting(true);
    setErrorMessage(null);

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Use existing AI tailoring endpoint
      // Pass instruction as userInstructions
      const response = await fetch(apiUrl('/api/ai/tailor'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          baseVersionId,
          jdId: jdId || null, // Use persisted JD ID
          mode: 'BALANCED',
          lockedSections: [],
          userInstructions: instruction.trim(), // Key parameter for Edit mode
        }),
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();
      setJobId(result.jobId);
      setStatus('QUEUED');
      setInstruction(''); // Clear input on success

      // Start polling
      pollJobStatus(result.jobId);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  };

  const pollJobStatus = async (id: string) => {
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

        if (result.status === 'COMPLETED') {
          setIsPolling(false);
          setShowProposal(true);
          return;
        }

        if (result.status === 'FAILED') {
          setIsPolling(false);
          return;
        }

        // Continue polling
        if (result.status === 'QUEUED' || result.status === 'RUNNING') {
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

  return (
    <div className="h-full flex flex-col">
      {/* Instructions/Status Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!jobId ? (
          <div className="space-y-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">How Edit Mode Works</h3>
              <ul className="text-xs text-gray-400 space-y-1.5">
                <li>• Describe what changes you want to your resume</li>
                <li>• AI generates a proposal (doesn't edit directly)</li>
                <li>• You review a diff showing exactly what changed</li>
                <li>• Accept or reject the proposal</li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-300 mb-2">Example Instructions:</p>
              <div className="text-xs text-blue-200/80 space-y-1">
                <p>• "Rewrite experience section for a backend role"</p>
                <p>• "Quantify all achievements with metrics"</p>
                <p>• "Make summary more concise and impactful"</p>
                <p>• "Emphasize cloud and distributed systems skills"</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Job Status */}
            <div className={`rounded-lg p-4 border ${
              status === 'COMPLETED' 
                ? 'bg-green-900/20 border-green-700/50' 
                : status === 'FAILED'
                ? 'bg-red-900/20 border-red-700/50'
                : 'bg-blue-900/20 border-blue-700/50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {(status === 'QUEUED' || status === 'RUNNING') && (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
                <span className="text-sm font-semibold text-gray-200">
                  {status === 'QUEUED' && 'Queued...'}
                  {status === 'RUNNING' && 'Processing...'}
                  {status === 'COMPLETED' && '✓ Proposal Ready'}
                  {status === 'FAILED' && '✗ Failed'}
                </span>
              </div>
              {errorMessage && (
                <p className="text-xs text-red-300 mt-2">{errorMessage}</p>
              )}
            </div>

            {/* Actions */}
            {status === 'COMPLETED' && (
              <button
                onClick={() => setShowProposal(true)}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Review Proposal
              </button>
            )}
            
            <button
              onClick={resetJob}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              {status === 'FAILED' ? 'Try Again' : 'Cancel & Start Over'}
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      {!jobId && (
        <div className="flex-shrink-0 border-t border-gray-700 p-4 bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-3">
            {!baseVersionId && (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
                <p className="text-xs text-yellow-300">
                  ⚠️ Load a resume version first to use Edit mode
                </p>
              </div>
            )}
            
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={
                isLocked
                  ? 'Editor is locked during AI processing...'
                  : 'Describe what changes you want...'
              }
              disabled={!baseVersionId || isLocked || isStarting}
              className="w-full px-4 py-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={4}
            />
            
            <div className="flex items-center justify-between">
              {/* Left: JD Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenJdModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-all"
                  title={hasJd ? 'Edit Job Description' : 'Add Job Description'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {hasJd ? 'JD' : 'Add JD'}
                </button>
                
                {/* JD Status Badge */}
                {isLoadingJds ? (
                  <span className="text-xs text-gray-500">Loading...</span>
                ) : jdError ? (
                  <span className="text-xs text-red-400">Error loading JD</span>
                ) : hasJd ? (
                  <button
                    type="button"
                    onClick={onRemoveJd}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    ✓ Loaded
                  </button>
                ) : null}
              </div>

              {/* Right: Submit Button */}
              <button
                type="submit"
                disabled={!canSubmit || isStarting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
              >
                {isStarting ? 'Starting...' : 'Generate Proposal'}
              </button>
            </div>
          </form>
        </div>
      )}

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
          getToken={getToken}
        />
      )}
    </div>
  );
}

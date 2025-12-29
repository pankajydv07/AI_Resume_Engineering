'use client';

import { useState, useEffect } from 'react';
import { DiffViewer } from './DiffViewer';
import { ProposalActions } from './ProposalActions';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';

/**
 * PHASE 6: Proposal Modal Component
 * PHASE 7.3: Enhanced error handling for missing proposals
 * 
 * WHY THIS MODAL EXISTS:
 * This is the critical trust boundary between AI and user data. The modal forces users to
 * review AI changes before they become part of the version history. The side-by-side diff
 * makes it clear EXACTLY what will change. No surprises, no hidden edits.
 * 
 * WHY ACCEPT/REJECT (NO PARTIAL):
 * Allowing line-by-line acceptance adds significant UX complexity and merge conflict scenarios.
 * All-or-nothing is a deliberate simplification. Users can always manually edit after accepting.
 * 
 * WHY BLOCK UI:
 * The modal is deliberately intrusive (full-screen, blocks editor). Users cannot accidentally
 * accept a proposal by clicking outside. This forces intentional decision-making.
 * 
 * PHASE 7.3: Robustness
 * - Handles missing proposal data gracefully
 * - Shows clear error messages
 * - Prevents modal crash on API errors
 */

interface ProposalModalProps {
  aiJobId: string;
  projectId: string;
  baseVersionId: string;
  baseLatexContent: string;
  onAccepted: (newVersionId: string) => void;
  onRejected: () => void;
  onClose: () => void;
}

export function ProposalModal({
  aiJobId,
  projectId,
  baseVersionId,
  baseLatexContent,
  onAccepted,
  onRejected,
  onClose,
}: ProposalModalProps) {
  const [proposedContent, setProposedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // FUTURE PHASE 8: Add Clerk JWT authentication  
        const response = await fetch(`http://localhost:3001/api/ai/jobs/${aiJobId}/proposal`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token-user-123',
          },
        });

        if (!response.ok) {
          const errorInfo = await handleHttpError(response);
          // PHASE 7.3: Custom message for 404 on proposal
          if (errorInfo.statusCode === 404) {
            throw new Error('Proposal not found. The AI job may not have generated a proposal.');
          }
          throw errorInfo;
        }

        const result = await response.json();
        
        // PHASE 7.3: Validate proposal data exists
        if (!result || !result.proposedLatexContent) {
          throw new Error('Proposal data is missing or incomplete.');
        }
        
        setProposedContent(result.proposedLatexContent);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposal();
  }, [aiJobId]);

  const handleAccept = (newVersionId: string) => {
    onAccepted(newVersionId);
    onClose();
  };

  const handleReject = () => {
    onRejected();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            AI Resume Proposal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading proposal...</div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="text-center max-w-md">
                <svg
                  className="mx-auto h-12 w-12 text-red-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Proposal</h3>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-gray-500 text-sm mt-2">
                  The AI job completed, but the proposal could not be retrieved. Please try again or check the AI Jobs page.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          )}

          {!isLoading && !error && proposedContent && (
            <>
              {/* Diff Viewer */}
              <div className="flex-1 overflow-hidden mb-4">
                <DiffViewer
                  baseContent={baseLatexContent}
                  proposedContent={proposedContent}
                  baseLabel="Current Resume"
                  proposedLabel="AI Proposal"
                />
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                <ProposalActions
                  aiJobId={aiJobId}
                  projectId={projectId}
                  baseVersionId={baseVersionId}
                  onAccepted={handleAccept}
                  onRejected={handleReject}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

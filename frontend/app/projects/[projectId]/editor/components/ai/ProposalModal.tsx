'use client';

import { useState, useEffect } from 'react';
import { DiffViewer } from './DiffViewer';
import { ProposalActions } from './ProposalActions';

/**
 * PHASE 6: Proposal Modal Component
 * 
 * Displays AI proposal with diff viewer and accept/reject controls
 * Triggered when AI job status becomes COMPLETED
 * 
 * Flow:
 * 1. Fetch proposal content from backend
 * 2. Display side-by-side diff
 * 3. User accepts or rejects
 * 4. On accept: create new version and switch editor
 * 5. On reject: discard proposal and close modal
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
        // TODO: Replace with real Clerk token when auth is implemented
        const response = await fetch(`http://localhost:3001/api/ai/jobs/${aiJobId}/proposal`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token-user-123',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch proposal: ${response.statusText}`);
        }

        const result = await response.json();
        setProposedContent(result.proposedLatexContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
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
            <div className="flex items-center justify-center h-full">
              <div className="text-red-600">
                <strong>Error:</strong> {error}
              </div>
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

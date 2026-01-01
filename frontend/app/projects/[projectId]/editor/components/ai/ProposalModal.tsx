'use client';

import { useState, useEffect } from 'react';
import { DiffViewer } from './DiffViewer';
import { SectionDiffViewer } from './SectionDiffViewer';
import { ProposalActions } from './ProposalActions';
import { ProposalChat } from './ProposalChat';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';

/**
 * GOAL 4: Section-level proposal types
 */
export type SectionType = 'EDUCATION' | 'EXPERIENCE' | 'PROJECTS' | 'SKILLS' | 'ACHIEVEMENTS' | 'OTHER';

export interface SectionProposal {
  sectionType: SectionType;
  before: string;
  after: string;
  changeType: 'modified' | 'unchanged';
}

/**
 * PHASE 6: Proposal Modal Component
 * PHASE 7.3: Enhanced error handling for missing proposals
 * GOAL 4: Section-level diff display
 * GOAL 6: Chat-driven iteration
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
 * GOAL 6: Chat iteration enables refinement without closing the modal
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
  getToken: () => Promise<string | null>;
}

export function ProposalModal({
  aiJobId,
  projectId,
  baseVersionId,
  baseLatexContent,
  onAccepted,
  onRejected,
  onClose,
  getToken,
}: ProposalModalProps) {
  const [proposedContent, setProposedContent] = useState<string | null>(null);
  const [sectionProposals, setSectionProposals] = useState<SectionProposal[]>([]);
  const [acceptedSections, setAcceptedSections] = useState<Set<SectionType>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // GOAL 6: Chat state
  const [showChat, setShowChat] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(aiJobId);

  useEffect(() => {
    const fetchProposal = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // PHASE 8: Real Clerk JWT authentication
        const token = await getToken();
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(apiUrl(`/api/ai/jobs/${currentJobId}/proposal`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
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
        
        // GOAL 4: Extract section proposals if available
        if (result.sectionProposals && Array.isArray(result.sectionProposals)) {
          setSectionProposals(result.sectionProposals);
          
          // GOAL 4: By default, accept all modified sections
          const modifiedSections = result.sectionProposals
            .filter((p: SectionProposal) => p.changeType === 'modified')
            .map((p: SectionProposal) => p.sectionType);
          setAcceptedSections(new Set(modifiedSections));
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
        setIsRefining(false); // GOAL 6: Clear refining state
      }
    };

    fetchProposal();
  }, [currentJobId, getToken]); // GOAL 6: Re-fetch when currentJobId changes

  // GOAL 4: Toggle section acceptance
  const toggleSection = (sectionType: SectionType) => {
    setAcceptedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionType)) {
        newSet.delete(sectionType);
      } else {
        newSet.add(sectionType);
      }
      return newSet;
    });
  };

  // GOAL 4: Accept/reject all sections
  const acceptAll = () => {
    const allModified = sectionProposals
      .filter(p => p.changeType === 'modified')
      .map(p => p.sectionType);
    setAcceptedSections(new Set(allModified));
  };

  const rejectAll = () => {
    setAcceptedSections(new Set());
  };

  const handleAccept = (newVersionId: string) => {
    onAccepted(newVersionId);
    onClose();
  };

  const handleReject = () => {
    onRejected();
    onClose();
  };

  // GOAL 6: Handle chat-driven refinement
  const handleRefineRequest = async (feedback: string) => {
    setIsRefining(true);
    setError(null);

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl('/api/ai/proposal/refine'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiJobId: currentJobId,
          feedback,
        }),
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();
      
      // Start polling for the new job
      setCurrentJobId(result.jobId);
      pollForCompletion(result.jobId);
    } catch (err) {
      setError(getErrorMessage(err));
      setIsRefining(false);
    }
  };

  // GOAL 6: Poll for refinement completion
  const pollForCompletion = async (jobId: string) => {
    const maxAttempts = 60; // 1 minute max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Refinement timed out. Please try again.');
        setIsRefining(false);
        return;
      }

      try {
        const token = await getToken();
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(apiUrl(`/api/ai/jobs/${jobId}`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to check job status');
        }

        const jobStatus = await response.json();

        if (jobStatus.status === 'COMPLETED') {
          // Trigger re-fetch of proposal via useEffect
          setCurrentJobId(jobId);
          return;
        } else if (jobStatus.status === 'FAILED') {
          throw new Error(jobStatus.errorMessage || 'Refinement failed');
        } else {
          // Continue polling
          attempts++;
          setTimeout(poll, 1000);
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setIsRefining(false);
      }
    };

    poll();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              AI Resume Proposal
            </h2>
            {/* GOAL 6: Chat toggle */}
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                showChat
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showChat ? '✓ Chat Active' : 'Refine with Chat'}
            </button>
          </div>
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
        <div className="flex-1 overflow-hidden flex">
          {/* Main proposal area */}
          <div className={`flex-1 overflow-hidden flex flex-col p-6 ${showChat ? 'w-2/3' : 'w-full'}`}>
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
              {/* GOAL 4: Section-based diff view or fallback to full LaTeX */}
              <div className="flex-1 overflow-auto mb-4">
                {sectionProposals.length > 0 ? (
                  <div className="space-y-4">
                    {/* Accept/Reject All Buttons */}
                    <div className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <span className="font-semibold">{acceptedSections.size}</span> of{' '}
                        <span className="font-semibold">
                          {sectionProposals.filter(p => p.changeType === 'modified').length}
                        </span>{' '}
                        modified sections selected
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={acceptAll}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Accept All
                        </button>
                        <button
                          type="button"
                          onClick={rejectAll}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Reject All
                        </button>
                      </div>
                    </div>

                    {/* Section Diffs */}
                    <div className="space-y-3">
                      {sectionProposals.map((proposal) => (
                        <SectionDiffViewer
                          key={proposal.sectionType}
                          proposal={proposal}
                          isAccepted={acceptedSections.has(proposal.sectionType)}
                          onToggle={toggleSection}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Fallback to full LaTeX diff if no section proposals */
                  <DiffViewer
                    baseContent={baseLatexContent}
                    proposedContent={proposedContent}
                    baseLabel="Current Resume"
                    proposedLabel="AI Proposal"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                <ProposalActions
                  aiJobId={currentJobId}
                  projectId={projectId}
                  baseVersionId={baseVersionId}
                  acceptedSections={Array.from(acceptedSections)}
                  onAccepted={handleAccept}
                  onRejected={handleReject}
                  getToken={getToken}
                />
              </div>
            </>
          )}
        </div>

        {/* GOAL 6: Chat panel */}
        {showChat && (
          <div className="w-1/3 h-full">
            <ProposalChat
              aiJobId={currentJobId}
              projectId={projectId}
              onRefineRequest={handleRefineRequest}
              isRefining={isRefining}
            />
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

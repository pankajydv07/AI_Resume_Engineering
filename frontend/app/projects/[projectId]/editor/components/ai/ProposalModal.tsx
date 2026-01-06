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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/90 backdrop-blur-md">
      <div className="glass-card w-[95vw] h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-glass">
        {/* Header - Matching website dark theme */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-900/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gradient">
                  AI Resume Proposal
                </h2>
                <p className="text-xs text-dark-400">Review and accept changes</p>
              </div>
            </div>
            {/* GOAL 6: Chat toggle - Dark theme */}
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showChat
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'glass text-dark-100 hover:bg-white/10'
              }`}
            >
              {showChat ? '✓ Chat Active' : '💬 Refine with Chat'}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-dark-400 hover:text-dark-100 transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex bg-dark-900">
          {/* Main proposal area */}
          <div className={`flex-1 overflow-hidden flex flex-col p-6 ${showChat ? 'w-2/3' : 'w-full'}`}>
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary-500 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-dark-100 font-medium">Loading proposal...</p>
                <p className="text-dark-400 text-sm mt-1">Preparing AI-generated changes</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="text-center max-w-md glass-card p-8 border border-white/10">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="h-8 w-8 text-red-400"
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
                </div>
                <h3 className="text-lg font-bold text-dark-100 mb-2">Failed to Load Proposal</h3>
                <p className="text-red-400 text-sm font-medium mb-3">{error}</p>
                <p className="text-dark-400 text-sm">
                  The AI job completed, but the proposal could not be retrieved. Please try again or check the AI Jobs page.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-dark-800 text-dark-100 rounded-lg hover:bg-dark-700 transition-all duration-200 shadow-lg text-sm font-medium border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && proposedContent && (
            <>
              {/* GOAL 4: Section-based diff view or fallback to full LaTeX */}
              <div className="flex-1 overflow-auto mb-4">
                {sectionProposals.length > 0 ? (
                  <div className="space-y-4">
                    {/* Accept/Reject All Buttons - Dark theme */}
                    <div className="flex items-center justify-between glass-card px-6 py-4 border border-white/10">
                      <div className="text-sm flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-glow">
                          {acceptedSections.size}
                        </div>
                        <div>
                          <p className="font-semibold text-dark-100">Sections Selected</p>
                          <p className="text-xs text-dark-400">
                            {acceptedSections.size} of {sectionProposals.filter(p => p.changeType === 'modified').length} modified sections
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={acceptAll}
                          className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-glow"
                        >
                          ✓ Accept All
                        </button>
                        <button
                          type="button"
                          onClick={rejectAll}
                          className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-glow"
                        >
                          ✕ Reject All
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

'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/api';

/**
 * PHASE 6: Proposal Accept/Reject Component
 * GOAL 4: Support selective section acceptance
 * 
 * WHY EXPLICIT ACCEPT/REJECT:
 * These are the only two paths for a ProposedVersion. There is no "save draft" or "auto-apply".
 * Accept → creates new ResumeVersion (type: AI_GENERATED) and adds it to version history.
 * Reject → proposal is discarded, no version created, no state change.
 * 
 * GOAL 4: Selective Acceptance:
 * Users can now accept/reject individual sections. The acceptedSections array is sent
 * to the backend, which merges only those sections into the final version.
 * If acceptedSections is empty/undefined, all sections are accepted (backward compat).
 * 
 * WHY BACKEND CREATES VERSION:
 * Version creation happens server-side to enforce immutability guarantees. Frontend never
 * directly writes to the version graph. This prevents race conditions and ensures audit integrity.
 * 
 * WHY NO UNDO AFTER ACCEPT:
 * Once accepted, the AI-generated version is indistinguishable from any other version.
 * Users can switch back to previous versions via the version selector, but there's no
 * "undo AI accept" button. This simplifies the mental model: versions are immutable.
 */

interface ProposalActionsProps {
  aiJobId: string;
  projectId: string;
  baseVersionId: string;
  acceptedSections?: string[]; // GOAL 4: Optional selective acceptance
  onAccepted: (newVersionId: string) => void;
  onRejected: () => void;
  getToken: () => Promise<string | null>;
}

export function ProposalActions({
  aiJobId,
  projectId,
  baseVersionId,
  acceptedSections,
  onAccepted,
  onRejected,
  getToken,
}: ProposalActionsProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      // PHASE 8: Real Clerk JWT authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl('/api/ai/proposal/accept'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiJobId,
          projectId,
          acceptedSections, // GOAL 4: Send selected sections
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to accept proposal: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Notify parent component to switch to new version
      onAccepted(result.newVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setError(null);

    try {
      // PHASE 8: Real Clerk JWT authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl('/api/ai/proposal/reject'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiJobId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject proposal: ${response.statusText}`);
      }

      // Notify parent component
      onRejected();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="glass-card border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-dark-100 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Review Proposal
      </h3>


      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-400 mb-4 glass-card p-3 border border-red-500/30 bg-red-500/10 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Action Buttons - Dark theme */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isAccepting || isRejecting}
          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-glow"
        >
          {isAccepting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Accepting...
            </span>
          ) : (
            '✓ Accept Proposal'
          )}
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isAccepting || isRejecting}
          className="flex-1 px-4 py-3 text-sm font-medium text-dark-100 glass border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isRejecting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Rejecting...
            </span>
          ) : (
            '✗ Reject Proposal'
          )}
        </button>
      </div>
    </div>
  );
}

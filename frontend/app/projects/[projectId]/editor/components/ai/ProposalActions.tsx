'use client';

import { useState } from 'react';

/**
 * PHASE 6: Proposal Accept/Reject Component
 * 
 * WHY EXPLICIT ACCEPT/REJECT:
 * These are the only two paths for a ProposedVersion. There is no "save draft" or "auto-apply".
 * Accept → creates new ResumeVersion (type: AI_GENERATED) and adds it to version history.
 * Reject → proposal is discarded, no version created, no state change.
 * 
 * WHY BACKEND CREATES VERSION:
 * Version creation happens server-side to enforce immutability guarantees. Frontend never
 * directly writes to the version graph. This prevents race conditions and ensures audit integrity.
 * 
 * WHY NO UNDO AFTER ACCEPT:
 * Once accepted, the AI-generated version is indistinguishable from any other version.
 * Users can switch back to previous versions via the version selector, but there's no
 * "undo AI accept" button. This simplifies the mental model: versions are immutable.
 * 
 * Forbidden:
 * - No partial acceptance
 * - No silent apply
 */

interface ProposalActionsProps {
  aiJobId: string;
  projectId: string;
  baseVersionId: string;
  onAccepted: (newVersionId: string) => void;
  onRejected: () => void;
  getToken: () => Promise<string | null>;
}

export function ProposalActions({
  aiJobId,
  projectId,
  baseVersionId,
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

      const response = await fetch('http://localhost:3001/api/ai/proposal/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiJobId,
          projectId,
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

      const response = await fetch('http://localhost:3001/api/ai/proposal/reject', {
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
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Review Proposal
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Accept this proposal to create a new resume version, or reject it to keep your current resume unchanged.
      </p>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
        <div className="text-xs text-amber-800">
          <strong>⚠ Important:</strong> Accepting will create a new resume version. Your base resume will remain unchanged and accessible via version history.
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isAccepting || isRejecting}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isAccepting ? 'Accepting...' : '✓ Accept Proposal'}
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isAccepting || isRejecting}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRejecting ? 'Rejecting...' : '✗ Reject Proposal'}
        </button>
      </div>

      {/* Phase Notice */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          PHASE 6: Explicit user action required. No auto-apply.
        </div>
      </div>
    </div>
  );
}

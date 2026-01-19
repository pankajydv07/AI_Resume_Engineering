'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 md:p-6">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-blue-400" />
        Review Proposal
      </h3>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-400 mb-4 bg-red-500/10 p-3 border border-red-500/30 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={handleAccept}
          disabled={isAccepting || isRejecting}
          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          whileHover={{ scale: isAccepting || isRejecting ? 1 : 1.02 }}
          whileTap={{ scale: isAccepting || isRejecting ? 1 : 0.98 }}
        >
          {isAccepting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Accepting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Accept Proposal
            </span>
          )}
        </motion.button>

        <motion.button
          type="button"
          onClick={handleReject}
          disabled={isAccepting || isRejecting}
          className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          whileHover={{ scale: isAccepting || isRejecting ? 1 : 1.02 }}
          whileTap={{ scale: isAccepting || isRejecting ? 1 : 0.98 }}
        >
          {isRejecting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Rejecting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" />
              Reject Proposal
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}

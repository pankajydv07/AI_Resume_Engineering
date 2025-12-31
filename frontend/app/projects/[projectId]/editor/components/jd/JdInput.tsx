'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/api';

/**
 * PHASE 4: JD Input Component
 * 
 * Per userflow.md Section 2.6.1:
 * - Paste JD text
 * - Submit to backend
 * - Create JobDescription entity
 * 
 * Forbidden:
 * - No resume preview
 * - No analysis UI
 * - No validation beyond empty check
 */

interface JdInputProps {
  projectId: string;
  onJdSubmitted?: (jdId: string) => void;
  getToken: () => Promise<string | null>;
}

export function JdInput({ projectId, onJdSubmitted, getToken }: JdInputProps) {
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!rawText.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // PHASE 8: Real Clerk JWT authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl('/api/jd'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          rawText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit JD: ${response.statusText}`);
      }

      const result = await response.json();

      // Clear textarea after success
      setRawText('');
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Notify parent if callback provided
      if (onJdSubmitted) {
        onJdSubmitted(result.jdId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Submit Job Description
      </h3>

      {/* JD Textarea */}
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        disabled={isSubmitting}
        className="w-full h-40 p-3 border border-gray-300 rounded text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        placeholder="Paste job description text here..."
      />

      {/* File Upload Placeholder (PDF) */}
      {/* TODO: Implement PDF upload functionality
          - Accept .pdf files
          - Extract text content
          - Populate rawText textarea
          - Handle errors (invalid format, extraction failure)
          Per userflow.md Section 2.6.1: "Upload JD PDF"
      */}
      <div className="mt-3 p-3 border border-dashed border-gray-300 rounded bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          PDF Upload (Coming Soon)
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          {showSuccess && (
            <span className="text-sm text-green-600 font-medium">
              ✓ Job description submitted
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!rawText.trim() || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit JD'}
        </button>
      </div>
    </div>
  );
}

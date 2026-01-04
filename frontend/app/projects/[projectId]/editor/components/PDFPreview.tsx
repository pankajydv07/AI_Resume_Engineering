'use client';

import { useState, useEffect } from 'react';

/**
 * PHASE 3: PDF Preview Component
 * PHASE 8: Enhanced with cache-busting and compile status
 * 
 * Per userflow.md Section 2.5:
 * - RIGHT side of editor layout
 * - Shows compiled PDF preview
 * - Refreshes when pdfUrl changes (compilation completes)
 */

interface PDFPreviewProps {
  pdfUrl: string | null;
  versionId: string | null;
}

export function PDFPreview({ pdfUrl, versionId }: PDFPreviewProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  // Update display URL with cache-busting when pdfUrl changes
  useEffect(() => {
    if (pdfUrl) {
      // Add timestamp to force iframe reload (cache-busting)
      const cacheBustedUrl = `${pdfUrl}?t=${Date.now()}`;
      setDisplayUrl(cacheBustedUrl);
    } else {
      setDisplayUrl(null);
    }
  }, [pdfUrl, versionId]);

  return (
    <div className="flex flex-col h-full bg-zinc-900/40 backdrop-blur-sm">
      {/* Preview Header */}
      <div className="bg-zinc-900/60 backdrop-blur-md border-b border-white/10 px-4 py-2">
        <h2 className="text-sm font-semibold text-zinc-200">PDF Preview</h2>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-zinc-950/50 flex items-center justify-center p-4">
        {displayUrl ? (
          <iframe
            key={displayUrl} // Force remount on URL change
            src={displayUrl}
            className="w-full h-full border border-white/10 bg-white shadow-lg rounded-sm"
            title="Resume PDF Preview"
          />
        ) : (
          <div className="text-center text-zinc-400">
            <svg
              className="w-20 h-20 mx-auto mb-4 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-base font-medium text-zinc-300 mb-1">No PDF yet</p>
            <p className="text-sm text-zinc-500">
              Click "Compile PDF" to generate preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex flex-col h-full bg-gradient-to-br from-dark-950 via-dark-900/50 to-dark-950">
      {/* Preview Header */}
      <div className="glass border-b border-white/5 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">PDF Preview</h2>
            <p className="text-xs text-dark-400 mt-0.5">
              {displayUrl ? 'Live preview of your compiled resume' : 'Compile to see preview'}
            </p>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-dark-950/50 flex items-center justify-center p-6 border-t border-white/5">
        {displayUrl ? (
          <div className="w-full h-full relative">
            <iframe
              key={displayUrl} // Force remount on URL change
              src={displayUrl}
              className="w-full h-full border border-white/10 bg-white shadow-2xl rounded-lg"
              title="Resume PDF Preview"
            />
            {/* Subtle overlay for glass effect */}
            <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-inset ring-white/5"></div>
          </div>
        ) : (
          <div className="text-center max-w-sm">
            <div className="glass-card p-8 rounded-2xl">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-white mb-2">No PDF Preview</p>
              <p className="text-sm text-dark-400 mb-4">
                Click the <span className="text-primary-400 font-medium">Compile PDF</span> button in the toolbar to generate your resume preview.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-dark-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Instant compilation</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

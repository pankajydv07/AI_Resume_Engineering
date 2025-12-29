'use client';

/**
 * PHASE 3: PDF Preview Component
 * 
 * Per userflow.md Section 2.5:
 * - RIGHT side of editor layout
 * - Shows compiled PDF preview
 * - For now: Placeholder (compilation logic is future phase)
 */

interface PDFPreviewProps {
  pdfUrl: string | null;
  versionId: string | null;
}

export function PDFPreview({ pdfUrl, versionId }: PDFPreviewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <h2 className="text-sm font-semibold text-gray-700">PDF Preview</h2>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border border-gray-300 bg-white shadow-sm"
            title="Resume PDF Preview"
          />
        ) : (
          <div className="text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
            <p className="text-sm">No PDF available</p>
            <p className="text-xs text-gray-400 mt-1">
              Compile your resume to see preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

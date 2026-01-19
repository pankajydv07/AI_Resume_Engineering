'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, ExternalLink } from 'lucide-react';

/**
 * REFACTORED PDF PREVIEW
 * 
 * Clean, minimal design with:
 * - No header (cleaner look)
 * - Beautiful empty state
 * - Smooth transitions
 */

interface PDFPreviewProps {
  pdfUrl: string | null;
  versionId: string | null;
}

export function PDFPreview({ pdfUrl, versionId }: PDFPreviewProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update display URL with cache-busting when pdfUrl changes
  useEffect(() => {
    if (pdfUrl) {
      setIsLoading(true);
      // Add timestamp to force iframe reload (cache-busting)
      const cacheBustedUrl = `${pdfUrl}?t=${Date.now()}`;
      setDisplayUrl(cacheBustedUrl);
    } else {
      setDisplayUrl(null);
    }
  }, [pdfUrl, versionId]);

  return (
    <div className="h-full flex flex-col">
      {/* PDF Content */}
      <div className="flex-1 relative">
        {displayUrl ? (
          <>
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/80 border border-white/10">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-300">Loading preview...</span>
                </div>
              </div>
            )}
            
            {/* PDF iframe */}
            <iframe
              key={displayUrl}
              src={displayUrl}
              className="w-full h-full bg-white"
              title="Resume PDF Preview"
              onLoad={() => setIsLoading(false)}
            />
            
            {/* Open in new tab button */}
            <motion.a
              href={pdfUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/90 backdrop-blur-sm border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open</span>
            </motion.a>
          </>
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center max-w-sm"
            >
              {/* Icon */}
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl blur-xl" />
                <div className="relative w-full h-full bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl border border-white/10 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-red-400" />
                </div>
              </div>
              
              {/* Text */}
              <h3 className="text-xl font-semibold text-white mb-2">No Preview Yet</h3>
              <p className="text-gray-400 text-sm mb-6">
                Compile your resume to see a live PDF preview here.
              </p>
              
              {/* Hint */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-300">
                  Click <span className="font-medium">Compile</span> to generate
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

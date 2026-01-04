'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiUrl } from '@/lib/api';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

/**
 * HEADER BAR - Premium dense glass header
 * 
 * Design: Single 56px bar with glassmorphism, minimal chrome, maximum density
 * Layout: [←] [Version] [PDF|AI] [Status] --- [Save] [⚡Compile] [PDF] [LaTeX]
 * 
 * REFINEMENTS:
 * - Merged panel toggle into header
 * - Error as minimal indicator with tooltip
 * - Compressed version selector
 * - Icon-only actions
 * - Enhanced glassmorphism
 */

interface Version {
  versionId: string;
  projectId: string;
  type: 'BASE' | 'MANUAL' | 'AI_GENERATED';
  status: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE';
  createdAt: string;
  parentVersionId: string | null;
}

interface HeaderBarProps {
  projectId: string;
  currentVersionId: string | null;
  currentVersionStatus?: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE' | null;
  isDirty: boolean;
  isLoading: boolean;
  error?: string | null;
  onSave: () => Promise<void>;
  onCompile?: () => Promise<void>;
  onVersionSwitch: (versionId: string) => Promise<void>;
  onSaveSuccess?: () => void;
  panelMode: 'pdf' | 'ai';
  onPanelModeChange: (mode: 'pdf' | 'ai') => void;
}

export function HeaderBar({
  projectId,
  currentVersionId,
  currentVersionStatus,
  isDirty,
  isLoading,
  error,
  onSave,
  onCompile,
  onVersionSwitch,
  onSaveSuccess,
  panelMode,
  onPanelModeChange,
}: HeaderBarProps) {
  const { getToken } = useAuth();
  
  // Version selector state
  const [versions, setVersions] = useState<Version[]>([]);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  
  // Action states
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Error chip state
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // Fetch versions
  useEffect(() => {
    if (projectId) {
      fetchVersions();
    }
  }, [projectId, currentVersionId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setIsVersionDropdownOpen(false);
      }
      if (errorRef.current && !errorRef.current.contains(event.target as Node)) {
        setIsErrorExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide save success
  useEffect(() => {
    if (showSaveSuccess) {
      const timer = setTimeout(() => setShowSaveSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showSaveSuccess]);

  const fetchVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(apiUrl(`/api/versions/project/${projectId}`), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: Version[] = await response.json();
        setVersions(data);
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      setShowSaveSuccess(true);
      onSaveSuccess?.();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompile = async () => {
    if (!onCompile) return;
    setIsCompiling(true);
    try {
      await onCompile();
    } finally {
      setIsCompiling(false);
    }
  };

  const handleVersionSwitch = async (versionId: string) => {
    if (versionId === currentVersionId) {
      setIsVersionDropdownOpen(false);
      return;
    }

    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Switching versions will discard them. Continue?'
      );
      if (!confirmed) return;
    }

    setIsVersionDropdownOpen(false);
    await onVersionSwitch(versionId);
  };

  const handleDownloadPdf = async () => {
    if (!currentVersionId) return;
    setIsDownloading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(apiUrl(`/api/versions/${currentVersionId}/download/pdf`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to download PDF');
      const result = await response.json();
      window.open(result.url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadLatex = async () => {
    if (!currentVersionId) return;
    setIsDownloading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(apiUrl(`/api/versions/${currentVersionId}/download/latex`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to download LaTeX');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${currentVersionId.substring(0, 8)}.tex`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentVersion = versions.find(v => v.versionId === currentVersionId);
  const isWarning = error?.startsWith('⚠️');

  // Compact version label (time only for header, full in dropdown)
  const formatVersionLabel = (version: Version | undefined): string => {
    if (!version) return 'Select';
    const date = new Date(version.createdAt);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatVersionDropdown = (version: Version): string => {
    const typeIcons: Record<string, string> = {
      BASE: '🏠',
      MANUAL: '✏️',
      AI_GENERATED: '🤖',
    };
    const date = new Date(version.createdAt).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${typeIcons[version.type]} ${date}`;
  };

  return (
    <>
      {/* Premium Dense Header - Single 56px bar */}
      <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-3 bg-gradient-to-b from-zinc-950/95 to-zinc-950/80 backdrop-blur-2xl border-b border-white/[0.03] shadow-[0_1px_0_0_rgba(255,255,255,0.02)]">
        {/* Left Section - Navigation & Context */}
        <div className="flex items-center gap-2">
          {/* Back Button - Minimal */}
          <Link
            href={`/projects/${projectId}`}
            className="p-1.5 -ml-1 text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] rounded-md transition-all"
            title="Back"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Version Selector - Compressed */}
          <div ref={versionDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
              disabled={isLoadingVersions || versions.length === 0}
              className="group flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="max-w-[120px] truncate">{formatVersionLabel(currentVersion)}</span>
              <span className={`text-zinc-500 transition-transform ${isVersionDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Version Dropdown - Premium */}
            {isVersionDropdownOpen && versions.length > 0 && (
              <div className="absolute left-0 mt-1.5 w-72 bg-zinc-900/98 backdrop-blur-2xl border border-white/[0.06] rounded-lg shadow-2xl overflow-hidden z-50 animate-slide-in-top">
                <div className="max-h-64 overflow-y-auto py-0.5">
                  {versions.map((version) => (
                    <button
                      key={version.versionId}
                      type="button"
                      onClick={() => handleVersionSwitch(version.versionId)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        version.versionId === currentVersionId
                          ? 'bg-blue-500/10 text-blue-300'
                          : 'text-zinc-300 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{formatVersionDropdown(version)}</span>
                        {version.status === 'ACTIVE' && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded font-medium">Active</span>
                        )}
                        {version.status === 'COMPILED' && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded font-medium">Ready</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-3 py-1.5 text-[10px] text-zinc-600 border-t border-white/[0.03] bg-zinc-950/80">
                  {versions.length} version{versions.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>

          {/* Panel Mode Toggle - Inline Segmented Control */}
          <div className="flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-md p-1">
            <button
              onClick={() => onPanelModeChange('pdf')}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                panelMode === 'pdf'
                  ? 'bg-white/[0.10] text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.05]'
              }`}
            >
              PDF Preview
            </button>
            <button
              onClick={() => onPanelModeChange('ai')}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                panelMode === 'ai'
                  ? 'bg-white/[0.10] text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.05]'
              }`}
            >
              AI Assistant
            </button>
          </div>

          {/* Status Indicator */}
          {error && (
            <div ref={errorRef} className="relative group">
              <button
                type="button"
                onClick={() => setIsErrorExpanded(!isErrorExpanded)}
                className={`px-3 py-1.5 text-sm font-medium border rounded-md transition-all ${
                  isWarning
                    ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20'
                    : 'text-red-400 bg-red-500/10 hover:bg-red-500/15 border-red-500/20'
                }`}
              >
                {isWarning ? '⚠ Warning' : '✕ Error'}
              </button>

              {/* Error Drawer - Detailed */}
              {isErrorExpanded && (
                <div className={`absolute left-0 mt-1.5 w-96 max-w-[90vw] rounded-lg shadow-2xl overflow-hidden z-50 border ${
                  isWarning
                    ? 'bg-amber-950/98 border-amber-500/15'
                    : 'bg-red-950/98 border-red-500/15'
                } backdrop-blur-2xl animate-slide-in-top`}>
                  <div className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className={`w-3.5 h-3.5 ${isWarning ? 'text-amber-400' : 'text-red-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-xs font-semibold ${isWarning ? 'text-amber-300' : 'text-red-300'}`}>
                        {isWarning ? 'Warning' : 'Failed'}
                      </span>
                    </div>
                    <pre className={`text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto ${
                      isWarning ? 'text-amber-200/80' : 'text-red-200/80'
                    }`}>
                      {error}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Premium Icon-Only Actions */}
        <div className="flex items-center gap-2">
        {/* Save Button - Secondary */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isLoading || !currentVersionId}
          className="px-4 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title={isDirty ? 'Save changes (Ctrl+S)' : 'No unsaved changes'}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        {/* Compile Button - Primary with HoverBorderGradient */}
        <div className="relative">
          <HoverBorderGradient
            as="button"
            onClick={() => {
              if (!currentVersionId || isCompiling || isLoading) return;
              handleCompile();
            }}
            containerClassName="rounded-md"
            className={`bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-5 py-1.5 text-sm font-semibold ${
              (!currentVersionId || isCompiling || isLoading) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
            duration={1}
          >
            {isCompiling ? 'Compiling...' : '⚡ Compile'}
          </HoverBorderGradient>
        </div>

        {/* Divider - Subtle */}
        <div className="w-px h-4 bg-white/[0.04]" />

        {/* Download PDF - Secondary */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={!currentVersionId || currentVersionStatus !== 'COMPILED' || isDownloading}
          className="px-4 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={currentVersionStatus === 'COMPILED' ? 'Download PDF' : 'Compile first to download PDF'}
        >
          PDF ↓
        </button>

        {/* Download LaTeX - Secondary */}
        <button
          type="button"
          onClick={handleDownloadLatex}
          disabled={!currentVersionId || isDownloading}
          className="px-4 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Download LaTeX source"
        >
          LaTeX ↓
        </button>
        </div>
      </header>
    </>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, SignOutButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronDown,
  Save,
  Zap,
  Download,
  FileText,
  FileCode,
  MoreVertical,
  Check,
  AlertCircle,
  Sparkles,
  Eye,
  Bot,
  Home,
  FolderOpen,
  Clock,
  Settings,
  LayoutDashboard,
  LogOut,
  User
} from 'lucide-react';

/**
 * REFACTORED EDITOR HEADER
 * 
 * Clean, minimal design with:
 * - Floating pill design with glassmorphism
 * - Breadcrumb navigation
 * - Compact version selector
 * - Panel mode toggle (PDF/AI)
 * - Actions collapsed into 3-dot menu
 */

interface Version {
  versionId: string;
  projectId: string;
  type: 'BASE' | 'MANUAL' | 'AI_GENERATED';
  status: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE';
  createdAt: string;
  parentVersionId: string | null;
}

interface EditorHeaderProps {
  projectId: string;
  projectName?: string;
  currentVersionId: string | null;
  currentVersionStatus?: 'DRAFT' | 'COMPILED' | 'ERROR' | 'ACTIVE' | null;
  isDirty: boolean;
  isLoading: boolean;
  error?: string | null;
  onSave: () => Promise<void>;
  onCompile?: () => Promise<void>;
  onVersionSwitch: (versionId: string) => Promise<void>;
  panelMode: 'pdf' | 'ai';
  onPanelModeChange: (mode: 'pdf' | 'ai') => void;
}

export function EditorHeader({
  projectId,
  projectName = 'Resume',
  currentVersionId,
  currentVersionStatus,
  isDirty,
  isLoading,
  error,
  onSave,
  onCompile,
  onVersionSwitch,
  panelMode,
  onPanelModeChange,
}: EditorHeaderProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  // State
  const [versions, setVersions] = useState<Version[]>([]);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  
  // Refs for click outside
  const versionRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch versions
  useEffect(() => {
    if (projectId) {
      fetchVersions();
    }
  }, [projectId, currentVersionId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (versionRef.current && !versionRef.current.contains(event.target as Node)) {
        setIsVersionOpen(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

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
      setShowSuccess('Saved');
      setIsActionsOpen(false);
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
      setShowSuccess('Compiled');
      setIsActionsOpen(false);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleVersionSwitch = async (versionId: string) => {
    if (versionId === currentVersionId) {
      setIsVersionOpen(false);
      return;
    }

    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Switching versions will discard them. Continue?'
      );
      if (!confirmed) return;
    }

    setIsVersionOpen(false);
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
      setShowSuccess('Downloaded');
      setIsActionsOpen(false);
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
      setShowSuccess('Downloaded');
      setIsActionsOpen(false);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentVersion = versions.find(v => v.versionId === currentVersionId);
  
  const getVersionIcon = (type: string) => {
    switch (type) {
      case 'BASE': return '🏠';
      case 'MANUAL': return '✏️';
      case 'AI_GENERATED': return '🤖';
      default: return '📄';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'COMPILED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ERROR': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-50 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Navigation & Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Back to Project - Minimal */}
          <Link
            href={`/projects/${projectId}`}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-white transition-colors hidden sm:inline">
              Back
            </span>
          </Link>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-300 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <Link href={`/projects/${projectId}`} className="hover:text-gray-300 transition-colors flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate">{projectName}</span>
            </Link>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-gray-400">Editor</span>
          </div>
        </div>

        {/* Center: Floating Control Bar */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20"
        >
          {/* Version Selector */}
          <div ref={versionRef} className="relative">
            <button
              onClick={() => setIsVersionOpen(!isVersionOpen)}
              disabled={isLoadingVersions || versions.length === 0}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all",
                "hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed",
                isVersionOpen && "bg-white/10"
              )}
            >
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 max-w-[120px] truncate">
                {currentVersion ? formatTime(currentVersion.createdAt) : 'Select version'}
              </span>
              <ChevronDown className={cn(
                "w-3 h-3 text-gray-500 transition-transform",
                isVersionOpen && "rotate-180"
              )} />
            </button>

            {/* Version Dropdown */}
            <AnimatePresence>
              {isVersionOpen && versions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
                >
                  <div className="p-2 border-b border-white/5">
                    <p className="text-xs text-gray-500 px-2">Version History</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {versions.map((version) => (
                      <button
                        key={version.versionId}
                        onClick={() => handleVersionSwitch(version.versionId)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all",
                          version.versionId === currentVersionId
                            ? "bg-blue-500/20 text-blue-300"
                            : "hover:bg-white/5 text-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{getVersionIcon(version.type)}</span>
                          <div>
                            <p className="text-sm font-medium">{formatTime(version.createdAt)}</p>
                            <p className="text-xs text-gray-500 capitalize">{version.type.toLowerCase().replace('_', ' ')}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border",
                          getStatusColor(version.status)
                        )}>
                          {version.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-white/10" />

          {/* Panel Mode Toggle */}
          <div className="flex items-center bg-white/5 rounded-xl p-0.5">
            <button
              onClick={() => onPanelModeChange('pdf')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                panelMode === 'pdf'
                  ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => onPanelModeChange('ai')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                panelMode === 'ai'
                  ? "bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-white/10" />

          {/* Quick Compile Button */}
          <button
            onClick={handleCompile}
            disabled={!currentVersionId || isCompiling || isLoading}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all",
              "bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30",
              "text-amber-400 border border-amber-500/20 hover:border-amber-500/40",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Zap className={cn("w-4 h-4", isCompiling && "animate-pulse")} />
            <span className="hidden sm:inline">{isCompiling ? 'Compiling...' : 'Compile'}</span>
          </button>

          {/* Actions Menu */}
          <div ref={actionsRef} className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className={cn(
                "p-2 rounded-xl transition-all hover:bg-white/10",
                isActionsOpen && "bg-white/10",
                isDirty && "ring-2 ring-amber-500/50"
              )}
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
              {isDirty && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>

            {/* Actions Dropdown */}
            <AnimatePresence>
              {isActionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
                >
                  <div className="p-1">
                    {/* Save */}
                    <button
                      onClick={handleSave}
                      disabled={!isDirty || isLoading || !currentVersionId || isSaving}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{isSaving ? 'Saving...' : 'Save Changes'}</p>
                        <p className="text-xs text-gray-500">Create new version</p>
                      </div>
                      {isDirty && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
                      <span className="text-xs text-gray-600">⌘S</span>
                    </button>

                    {/* Compile */}
                    <button
                      onClick={handleCompile}
                      disabled={!currentVersionId || isCompiling || isLoading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{isCompiling ? 'Compiling...' : 'Compile PDF'}</p>
                        <p className="text-xs text-gray-500">Generate preview</p>
                      </div>
                      <span className="text-xs text-gray-600">⌘⏎</span>
                    </button>

                    <div className="my-1 border-t border-white/5" />

                    {/* Download PDF */}
                    <button
                      onClick={handleDownloadPdf}
                      disabled={!currentVersionId || currentVersionStatus !== 'COMPILED' || isDownloading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FileText className="w-4 h-4 text-red-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">Download PDF</p>
                        <p className="text-xs text-gray-500">
                          {currentVersionStatus !== 'COMPILED' ? 'Compile first' : 'Export document'}
                        </p>
                      </div>
                    </button>

                    {/* Download LaTeX */}
                    <button
                      onClick={handleDownloadLatex}
                      disabled={!currentVersionId || isDownloading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FileCode className="w-4 h-4 text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">Download LaTeX</p>
                        <p className="text-xs text-gray-500">Export source code</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right: Status & Logo */}
        <div className="flex items-center gap-3">
          {/* Success Toast - Inline */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm"
              >
                <Check className="w-4 h-4" />
                {showSuccess}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Indicator */}
          {error && !showSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="max-w-[150px] truncate">{error}</span>
            </div>
          )}

          {/* Logo with User Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <motion.div 
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </button>

            {/* User Menu Dropdown */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-72 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                >
                  {/* User Info */}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      {user?.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full ring-2 ring-blue-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.fullName || user?.firstName || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.primaryEmailAddress?.emailAddress || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">Dashboard</p>
                        <p className="text-xs text-gray-500">View all projects</p>
                      </div>
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">Settings</p>
                        <p className="text-xs text-gray-500">API keys & preferences</p>
                      </div>
                    </Link>

                    <div className="my-1 border-t border-white/5" />

                    <SignOutButton>
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-500/10 transition-colors group"
                      >
                        <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-300 group-hover:text-red-400">Sign Out</p>
                          <p className="text-xs text-gray-500">Return to home</p>
                        </div>
                      </button>
                    </SignOutButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

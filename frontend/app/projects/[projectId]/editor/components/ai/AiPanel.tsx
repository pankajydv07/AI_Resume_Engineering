'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMode, type Message } from './ChatMode';
import { EditMode } from './EditMode';
import { JdInputModal } from './JdInputModal';
import { ModeSwitcher } from '@/components/ui/mode-switcher';
import { apiUrl } from '@/lib/api';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';

/**
 * AI PANEL — DUAL MODE INTERFACE
 * 
 * Replaces the existing JdPanel with a GPT-style AI assistant.
 * 
 * MODES:
 * 1. Chat Mode: Conversational, informational only, NEVER edits resume
 * 2. Edit Mode: Single instruction → AI proposal → diff review (existing flow)
 * 
 * CRITICAL SAFETY RULES:
 * - Chat mode cannot modify resume content
 * - Edit mode uses existing proposal + diff + accept/reject flow
 * - Resume content is NEVER mutated directly
 * - All AI changes go through review
 * 
 * JOB DESCRIPTION:
 * - Optional context for both modes
 * - Stored at panel level
 * - Can be added/edited/removed
 */

type PanelMode = 'chat' | 'edit';

interface AiPanelProps {
  projectId: string;
  baseVersionId: string | null;
  baseLatexContent: string;
  onVersionChange: (newVersionId: string) => void;
  getToken: () => Promise<string | null>;
  isEditorLocked?: boolean; // When AI job is running
}

export function AiPanel({
  projectId,
  baseVersionId,
  baseLatexContent,
  onVersionChange,
  getToken,
  isEditorLocked = false,
}: AiPanelProps) {
  const [mode, setMode] = useState<PanelMode>('chat');
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [jdId, setJdId] = useState<string | null>(null); // Track JD ID for Edit mode
  const [isJdModalOpen, setIsJdModalOpen] = useState(false);
  const [isLoadingJds, setIsLoadingJds] = useState(true);
  const [jdError, setJdError] = useState<string | null>(null);
  
  // Lift chat messages state to persist across panel hide/show
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'I can help you brainstorm improvements, suggest changes, and answer questions about your resume. Ask me anything!',
      timestamp: new Date(),
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Load existing JDs on mount
  useEffect(() => {
    const loadJds = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(apiUrl(`/api/jd/project/${projectId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorInfo = await handleHttpError(response);
          throw errorInfo;
        }

        const jds = await response.json();
        
        // Auto-select most recent JD if available
        if (jds.length > 0) {
          const mostRecent = jds[0]; // Already sorted by createdAt DESC
          setJobDescription(mostRecent.rawText);
          setJdId(mostRecent.jdId);
        }
      } catch (err) {
        setJdError(getErrorMessage(err));
      } finally {
        setIsLoadingJds(false);
      }
    };

    loadJds();
  }, [projectId, getToken]);

  // Save new JD to backend
  const handleSaveJd = async (jdText: string) => {
    try {
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
          rawText: jdText,
        }),
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();
      setJobDescription(jdText);
      setJdId(result.jdId);
      setIsJdModalOpen(false);
      setJdError(null);
    } catch (err) {
      setJdError(getErrorMessage(err));
    }
  };

  // Remove JD (local only for now)
  const handleRemoveJd = () => {
    setJobDescription(null);
    setJdId(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      {/* Header with smooth mode switcher */}
      <div className="flex-shrink-0 border-b border-gray-700/50 bg-gray-900/95 backdrop-blur-sm">
        <div className="px-4 py-3">
          <ModeSwitcher
            mode={mode}
            onModeChange={setMode}
            disabled={isEditorLocked}
          />
        </div>
      </div>

      {/* Mode Content with smooth transitions */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {mode === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="h-full"
            >
              <ChatMode
                projectId={projectId}
                baseLatexContent={baseLatexContent}
                jobDescription={jobDescription}
                isLocked={isEditorLocked}
                getToken={getToken}
                messages={chatMessages}
                setMessages={setChatMessages}
                isLoading={isChatLoading}
                setIsLoading={setIsChatLoading}
                onOpenJdModal={() => setIsJdModalOpen(true)}
                hasJd={!!jobDescription}
                isLoadingJds={isLoadingJds}
                jdError={jdError}
                onRemoveJd={handleRemoveJd}
              />
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="h-full"
            >
              <EditMode
                projectId={projectId}
                baseVersionId={baseVersionId}
                baseLatexContent={baseLatexContent}
                jdId={jdId}
                isLocked={isEditorLocked}
                onVersionChange={onVersionChange}
                getToken={getToken}
                onOpenJdModal={() => setIsJdModalOpen(true)}
                hasJd={!!jobDescription}
                isLoadingJds={isLoadingJds}
                jdError={jdError}
                onRemoveJd={handleRemoveJd}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* JD Input Modal */}
      {isJdModalOpen && (
        <JdInputModal
          currentJd={jobDescription}
          onSave={handleSaveJd}
          onClose={() => setIsJdModalOpen(false)}
        />
      )}
    </div>
  );
}

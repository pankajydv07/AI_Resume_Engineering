'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Settings, Sparkles, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ProposalModal } from './ProposalModal';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';
import { apiUrl } from '@/lib/api';
import { GradientAIChatInput } from '@/components/ui/gradient-ai-chat-input';

/**
 * EDIT MODE — CANVAS-STYLE AI EDITING
 * 
 * Single instruction input that triggers existing AI proposal flow.
 * Inspired by GPT Canvas, but SAFE:
 * - AI output goes to ProposedVersion (not applied directly)
 * - User sees diff + must explicitly Accept/Reject
 * - Resume content never mutated by AI
 * 
 * Examples:
 * - "Rewrite experience to match backend engineer role"
 * - "Quantify achievements where possible"
 * - "Make the summary more concise"
 * 
 * Uses existing:
 * - /api/ai/tailor endpoint
 * - ProposalModal for diff review
 * - Versioning system
 */

interface EditModeProps {
  projectId: string;
  baseVersionId: string | null;
  baseLatexContent: string;
  jdId: string | null; // Use JD ID instead of raw text
  isLocked: boolean;
  onVersionChange: (newVersionId: string) => void;
  getToken: () => Promise<string | null>;
  onOpenJdModal: () => void;
  hasJd: boolean;
  isLoadingJds: boolean;
  jdError: string | null;
  onRemoveJd: () => void;
}

export function EditMode({
  projectId,
  baseVersionId,
  baseLatexContent,
  jdId,
  isLocked,
  onVersionChange,
  getToken,
  onOpenJdModal,
  hasJd,
  isLoadingJds,
  jdError,
  onRemoveJd,
}: EditModeProps) {
  const [instruction, setInstruction] = useState('');
  const [modelProvider, setModelProvider] = useState<'QWEN' | 'AZURE_OPENAI' | 'GEMINI'>('QWEN');
  const [hasAzureKey, setHasAzureKey] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [checkingAzureKey, setCheckingAzureKey] = useState(true);
  const [checkingGeminiKey, setCheckingGeminiKey] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user has API keys configured
  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(apiUrl('/api/api-keys'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const keys = await response.json();
        const azureKey = keys.find((k: any) => k.provider === 'AZURE_OPENAI' && k.isValid);
        const geminiKey = keys.find((k: any) => k.provider === 'GEMINI' && k.isValid);
        setHasAzureKey(!!azureKey);
        setHasGeminiKey(!!geminiKey);
      }
    } catch (err) {
      console.error('Failed to check API keys:', err);
    } finally {
      setCheckingAzureKey(false);
      setCheckingGeminiKey(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  const canSubmit = baseVersionId && instruction.trim() && !jobId && !isLocked;

  const handleSendInstruction = async (message: string) => {
    if (!baseVersionId || !message.trim() || jobId || isLocked) return;

    setInstruction(message);
    setIsStarting(true);
    setErrorMessage(null);

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl('/api/ai/tailor'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          baseVersionId,
          jdId: jdId || null,
          mode: 'BALANCED',
          lockedSections: [],
          userInstructions: message.trim(),
          modelProvider,
        }),
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();
      setJobId(result.jobId);
      setStatus('QUEUED');
      setIsPolling(true); // Set polling state immediately
      setInstruction('');

      pollJobStatus(result.jobId);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsStarting(true);
    setErrorMessage(null);

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Use existing AI tailoring endpoint
      // Pass instruction as userInstructions
      const response = await fetch(apiUrl('/api/ai/tailor'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          baseVersionId,
          jdId: jdId || null, // Use persisted JD ID
          mode: 'BALANCED',
          lockedSections: [],
          userInstructions: instruction.trim(), // Key parameter for Edit mode
          modelProvider, // NEW: Send selected model provider
        }),
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();
      setJobId(result.jobId);
      setStatus('QUEUED');
      setIsPolling(true); // Set polling state immediately
      setInstruction(''); // Clear input on success

      // Start polling
      pollJobStatus(result.jobId);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  };

  const pollJobStatus = async (id: string) => {
    setIsPolling(true);

    const poll = async () => {
      try {
        const token = await getToken();
        
        if (!token) {
          setIsPolling(false);
          setErrorMessage('Not authenticated');
          return;
        }

        const response = await fetch(apiUrl(`/api/ai/jobs/${id}`), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorInfo = await handleHttpError(response);
          throw errorInfo;
        }

        const result = await response.json();
        setStatus(result.status);
        setErrorMessage(result.errorMessage);

        if (result.status === 'COMPLETED') {
          setIsPolling(false);
          setShowProposal(true);
          return;
        }

        if (result.status === 'FAILED') {
          setIsPolling(false);
          return;
        }

        // Continue polling
        if (result.status === 'QUEUED' || result.status === 'RUNNING') {
          pollingTimeoutRef.current = setTimeout(() => poll(), 2000);
        } else {
          setIsPolling(false);
        }
      } catch (err) {
        setErrorMessage(getErrorMessage(err));
        setIsPolling(false);
      }
    };

    poll();
  };

  const resetJob = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setJobId(null);
    setStatus(null);
    setErrorMessage(null);
    setIsPolling(false);
    setShowProposal(false);
  };

  const handleProposalAccepted = (newVersionId: string) => {
    onVersionChange(newVersionId);
    resetJob();
  };

  const handleProposalRejected = () => {
    resetJob();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Instructions/Status Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!jobId ? (
          <div className="space-y-4">
            {/* How it works card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-gray-200">How Edit Mode Works</h3>
              </div>
              <ul className="text-xs text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">1.</span>
                  <span>Describe what changes you want to your resume</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">2.</span>
                  <span>AI generates a proposal (doesn't edit directly)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">3.</span>
                  <span>You review a diff showing exactly what changed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">4.</span>
                  <span>Accept or reject the proposal</span>
                </li>
              </ul>
            </motion.div>

            {/* Example instructions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-700/30 rounded-xl p-4"
            >
              <p className="text-xs font-medium text-blue-300 mb-3 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                Example Instructions
              </p>
              <div className="grid gap-2">
                {[
                  "Rewrite experience section for a backend role",
                  "Quantify all achievements with metrics",
                  "Make summary more concise and impactful",
                  "Emphasize cloud and distributed systems skills"
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInstruction(example)}
                    className="text-left text-xs text-blue-200/80 hover:text-blue-100 px-3 py-2 rounded-lg bg-blue-800/20 hover:bg-blue-800/40 transition-all border border-blue-700/20 hover:border-blue-600/40"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Job Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-5 border backdrop-blur-sm ${
                status === 'COMPLETED' 
                  ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/20 border-green-600/30' 
                  : status === 'FAILED'
                  ? 'bg-gradient-to-br from-red-900/40 to-rose-900/20 border-red-600/30'
                  : 'bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border-blue-600/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {(status === 'QUEUED' || status === 'RUNNING') && (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                )}
                {status === 'COMPLETED' && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {status === 'FAILED' && (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-base font-semibold text-gray-200">
                  {status === 'QUEUED' && 'Queued...'}
                  {status === 'RUNNING' && 'AI is processing...'}
                  {status === 'COMPLETED' && 'Proposal Ready!'}
                  {status === 'FAILED' && 'Processing Failed'}
                </span>
              </div>
              
              {(status === 'QUEUED' || status === 'RUNNING') && (
                <p className="text-xs text-gray-400">
                  This may take a moment. You can continue working while we process your request.
                </p>
              )}
              
              {errorMessage && (
                <div className="flex items-start gap-2 mt-3 p-3 bg-red-950/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{errorMessage}</p>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <div className="space-y-3">
              {status === 'COMPLETED' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowProposal(true)}
                  className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-4 h-4" />
                  Review Proposal
                </motion.button>
              )}
              
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={resetJob}
                className="w-full px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 rounded-xl text-sm transition-all border border-gray-700/50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {status === 'FAILED' ? 'Try Again' : 'Cancel & Start Over'}
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      {!jobId && (
        <div className="flex-shrink-0 border-t border-gray-700/50 p-4 bg-gray-900/95 backdrop-blur-sm">
          {isStarting && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border border-blue-600/30 rounded-xl p-3 mb-4 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
              <p className="text-xs text-blue-300">
                Starting AI processing...
              </p>
            </motion.div>
          )}
          
          {!baseVersionId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border border-yellow-700/30 rounded-xl p-3 mb-4 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-300">
                Load a resume version first to use Edit mode
              </p>
            </motion.div>
          )}
          
          <GradientAIChatInput
            placeholder={
              isLocked
                ? 'Editor is locked during AI processing...'
                : 'Describe what changes you want...'
            }
            onSend={handleSendInstruction}
            disabled={!baseVersionId || isLocked || isStarting}
            showDropdown={true}
            showAttachButton={false}
            enableShadows={true}
            mainGradient={{
              light: {
                topLeft: "#93C5FD",
                topRight: "#A5B4FC",
                bottomRight: "#818CF8",
                bottomLeft: "#60A5FA"
              },
              dark: {
                topLeft: "#3B82F6",
                topRight: "#6366F1",
                bottomRight: "#4F46E5",
                bottomLeft: "#2563EB"
              }
            }}
            outerGradient={{
              light: {
                topLeft: "#60A5FA",
                topRight: "#818CF8",
                bottomRight: "#7C3AED",
                bottomLeft: "#3B82F6"
              },
              dark: {
                topLeft: "#2563EB",
                topRight: "#4F46E5",
                bottomRight: "#4338CA",
                bottomLeft: "#1D4ED8"
              }
            }}
            dropdownOptions={[
              { id: 'qwen', label: 'Default Model', value: 'QWEN' },
              { id: 'gemini', label: 'Gemini', value: 'GEMINI' },
              { id: 'azure', label: 'Azure GPT-5', value: 'AZURE_OPENAI' }
            ]}
            selectedOptionValue={modelProvider}
            onOptionSelect={(option) => {
              if (option.value === 'AZURE_OPENAI' && !hasAzureKey) {
                alert('Please add Azure OpenAI API key in Settings first');
                return;
              }
              if (option.value === 'GEMINI' && !hasGeminiKey) {
                alert('Please add Gemini API key in Settings first');
                return;
              }
              setModelProvider(option.value as 'QWEN' | 'AZURE_OPENAI' | 'GEMINI');
            }}
            customButtons={
              <>
                {/* JD Button */}
                <motion.button
                  type="button"
                  onClick={onOpenJdModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all"
                  title={hasJd ? 'Edit Job Description' : 'Add Job Description'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {hasJd ? 'JD' : 'Add JD'}
                </motion.button>
                
                {/* JD Status Badge */}
                {isLoadingJds ? (
                  <span className="text-xs text-gray-500">Loading...</span>
                ) : jdError ? (
                  <span className="text-xs text-red-400">Error</span>
                ) : hasJd ? (
                  <motion.button
                    type="button"
                    onClick={onRemoveJd}
                    className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✓ Loaded
                  </motion.button>
                ) : null}
              </>
            }
          />
        </div>
      )}

      {/* Proposal Modal */}
      {showProposal && jobId && baseVersionId && (
        <ProposalModal
          aiJobId={jobId}
          projectId={projectId}
          baseVersionId={baseVersionId}
          baseLatexContent={baseLatexContent}
          onAccepted={handleProposalAccepted}
          onRejected={handleProposalRejected}
          onClose={() => setShowProposal(false)}
          getToken={getToken}
        />
      )}
    </div>
  );
}

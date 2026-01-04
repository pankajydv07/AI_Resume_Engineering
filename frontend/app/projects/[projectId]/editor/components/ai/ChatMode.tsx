'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { apiUrl } from '@/lib/api';
import { handleHttpError, getErrorMessage } from '@/lib/errorHandling';

/**
 * CHAT MODE — CONVERSATIONAL AI ASSISTANT
 * 
 * GPT-style chat interface for:
 * - Brainstorming
 * - Getting suggestions
 * - Understanding resume gaps
 * - Asking how to improve alignment
 * 
 * CRITICAL: Chat mode is INFORMATIONAL ONLY
 * - Cannot edit resume content
 * - Cannot auto-apply suggestions
 * - Code blocks are view-only (with copy)
 * 
 * State is now managed by parent (AiPanel) to persist across hide/show cycles
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatModeProps {
  projectId: string;
  baseLatexContent: string;
  jobDescription: string | null;
  isLocked: boolean;
  getToken: () => Promise<string | null>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenJdModal: () => void;
  hasJd: boolean;
  isLoadingJds: boolean;
  jdError: string | null;
  onRemoveJd: () => void;
}

export function ChatMode({
  projectId,
  baseLatexContent,
  jobDescription,
  isLocked,
  getToken,
  messages,
  setMessages,
  isLoading,
  setIsLoading,
  onOpenJdModal,
  hasJd,
  isLoadingJds,
  jdError,
  onRemoveJd,
}: ChatModeProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isLocked) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Send to backend chat API
      const response = await fetch(apiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          message: userMessage.content,
          resumeContext: baseLatexContent,
          jdContext: jobDescription,
          conversationHistory: messages
            .filter(m => m.role !== 'system')
            .map(m => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      if (!response.ok) {
        const errorInfo = await handleHttpError(response);
        throw errorInfo;
      }

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${getErrorMessage(error)}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'system'
                  ? 'bg-gray-800 text-gray-300 border border-gray-700'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <div className="prose-sm text-gray-100 max-w-none">
                <ReactMarkdown
                  components={{
                    code(props) {
                      const { node, inline, className, children, ...rest } = props as any;
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      
                      return !inline && match ? (
                        <CodeBlock
                          language={match[1]}
                          code={codeString}
                        />
                      ) : (
                        <code className="bg-gray-900 px-1.5 py-0.5 rounded text-sm" {...rest}>
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-700 p-4 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLocked
                ? 'Editor is locked during AI processing...'
                : 'Ask me anything about your resume...'
            }
            disabled={isLocked || isLoading}
            className="w-full px-4 py-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
          />
          <div className="flex items-center justify-between">
            {/* Left: JD Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenJdModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-all"
                title={hasJd ? 'Edit Job Description' : 'Add Job Description'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {hasJd ? 'JD' : 'Add JD'}
              </button>
              
              {/* JD Status Badge */}
              {isLoadingJds ? (
                <span className="text-xs text-gray-500">Loading...</span>
              ) : jdError ? (
                <span className="text-xs text-red-400">Error loading JD</span>
              ) : hasJd ? (
                <button
                  type="button"
                  onClick={onRemoveJd}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  ✓ Loaded
                </button>
              ) : null}
            </div>

            {/* Right: Send Button */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Enter to send</span>
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isLocked}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Code Block Component with Copy Functionality
 */
interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

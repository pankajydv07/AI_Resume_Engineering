'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle } from 'lucide-react';

/**
 * GOAL 6: Chat-driven iteration component
 * 
 * Allows users to provide natural language feedback on AI proposals
 * and trigger refinement iterations
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ProposalChatProps {
  aiJobId: string;
  projectId: string;
  onRefineRequest: (feedback: string) => void;
  isRefining: boolean;
}

export function ProposalChat({
  aiJobId,
  projectId,
  onRefineRequest,
  isRefining,
}: ProposalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'Provide feedback on the AI proposal. For example: "Make the experience section more technical" or "Add more keywords from the job description".',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isRefining) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    onRefineRequest(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-900/80">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          Refine Proposal
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Chat with AI to improve the proposal
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : message.role === 'assistant'
                  ? 'bg-gray-800 border border-gray-700 text-gray-200'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user'
                    ? 'text-blue-200'
                    : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}
        {isRefining && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-gray-400">AI is refining...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-900/80">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isRefining}
            placeholder="Type your feedback..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-900 disabled:cursor-not-allowed"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isRefining}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            whileHover={{ scale: !input.trim() || isRefining ? 1 : 1.02 }}
            whileTap={{ scale: !input.trim() || isRefining ? 1 : 0.98 }}
          >
            {isRefining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isRefining ? 'Refining...' : 'Send'}
          </motion.button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send. Your feedback will trigger a new AI iteration.
        </p>
      </div>
    </div>
  );
}

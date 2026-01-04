'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Toast Notification System
 * 
 * Non-blocking notifications for background processes.
 * Shows process status without blocking the UI.
 * 
 * Types:
 * - info: Informational messages (blue)
 * - success: Success messages (green)
 * - error: Error messages (red)
 * - loading: In-progress operations (animated)
 */

export type ToastType = 'info' | 'success' | 'error' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent until dismissed
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === 'loading' ? 0 : 4000),
      dismissible: toast.dismissible ?? true,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => onRemove(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const bgColor = {
    info: 'bg-blue-900/90 border-blue-500/50',
    success: 'bg-emerald-900/90 border-emerald-500/50',
    error: 'bg-red-900/90 border-red-500/50',
    loading: 'bg-zinc-800/95 border-zinc-600/50',
  }[toast.type];

  const iconColor = {
    info: 'text-blue-400',
    success: 'text-emerald-400',
    error: 'text-red-400',
    loading: 'text-zinc-300',
  }[toast.type];

  return (
    <div
      className={`${bgColor} backdrop-blur-md border rounded-lg shadow-2xl px-4 py-3 animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${iconColor}`}>
          {toast.type === 'loading' ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : toast.type === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{toast.title}</p>
          {toast.message && (
            <p className="mt-1 text-xs text-zinc-300 line-clamp-2">{toast.message}</p>
          )}
        </div>

        {/* Dismiss button */}
        {toast.dismissible && toast.type !== 'loading' && (
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

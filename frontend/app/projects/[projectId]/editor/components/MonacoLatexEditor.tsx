'use client';

import { useRef, useEffect } from 'react';
import Editor, { OnChange, OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

/**
 * Monaco Editor wrapper for LaTeX editing
 * 
 * Drop-in replacement for <textarea> with identical behavior:
 * - Same value/onChange contract
 * - Same controlled component pattern
 * - No internal state management
 * - Immediate onChange forwarding
 * 
 * CRITICAL: This component does NOT own or manage editor state.
 * It is a pure presentation layer that forwards all changes immediately.
 */

interface MonacoLatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface ErrorHighlight {
  line: number;
  message: string;
}

/**
 * Optional helper for highlighting compilation errors
 * Call this from parent component after compilation fails
 */
export function useMonacoErrorHighlighting() {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const highlightErrors = (errors: ErrorHighlight[]) => {
    if (!editorRef.current) return;

    const newDecorations: Monaco.editor.IModelDeltaDecoration[] = errors.map((error) => ({
      range: new (window as any).monaco.Range(error.line, 1, error.line, 1),
      options: {
        isWholeLine: true,
        className: 'bg-red-100',
        glyphMarginClassName: 'text-red-600',
        hoverMessage: { value: error.message },
        minimap: {
          color: '#ef4444',
          position: 2, // inline
        },
      },
    }));

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  };

  const clearErrors = () => {
    if (!editorRef.current) return;
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
  };

  return {
    editorRef,
    highlightErrors,
    clearErrors,
  };
}

export function MonacoLatexEditor({
  value,
  onChange,
  onBlur,
  disabled = false,
  className = '',
}: MonacoLatexEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Blur handler
    if (onBlur) {
      editor.onDidBlurEditorText(() => {
        onBlur();
      });
    }

    // Configure LaTeX language if not already registered
    const languages = monaco.languages.getLanguages();
    const latexExists = languages.some((lang: { id: string }) => lang.id === 'latex');

    if (!latexExists) {
      monaco.languages.register({ id: 'latex' });
      
      // Basic LaTeX syntax highlighting
      monaco.languages.setMonarchTokensProvider('latex', {
        tokenizer: {
          root: [
            [/\\[a-zA-Z@]+/, 'keyword'],
            [/\\[^a-zA-Z@]/, 'keyword'],
            [/%.*$/, 'comment'],
            [/\{/, 'delimiter.curly'],
            [/\}/, 'delimiter.curly'],
            [/\[/, 'delimiter.square'],
            [/\]/, 'delimiter.square'],
            [/\$/, 'string'],
          ],
        },
      });
    }
  };

  const handleEditorChange: OnChange = (newValue) => {
    // Forward change immediately - no debouncing, no internal state
    onChange(newValue ?? '');
  };

  // Disable/enable editor when disabled prop changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: disabled });
    }
  }, [disabled]);

  return (
    <div className={`h-full w-full ${className}`}>
      <Editor
        height="100%"
        language="latex"
        value={value}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          minimap: { enabled: false },
          automaticLayout: true,
          readOnly: disabled,
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: false,
        }}
        loading={<div className="flex items-center justify-center h-full text-gray-400">Loading editor...</div>}
      />
    </div>
  );
}

/**
 * SSR-safe wrapper (use if needed for App Router)
 * 
 * Usage:
 * import dynamic from 'next/dynamic';
 * const MonacoLatexEditor = dynamic(() => import('./MonacoLatexEditor').then(mod => ({ default: mod.MonacoLatexEditor })), { ssr: false });
 */

'use client';

import { useRef, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

/**
 * GOAL 4: Monaco Diff Editor for Section Diffs
 * 
 * VS Code-style inline diff viewer with:
 * - Red highlighting for removed lines
 * - Green highlighting for added lines
 * - Side-by-side or inline view
 */

interface MonacoDiffViewerProps {
  originalContent: string;
  modifiedContent: string;
  originalLabel?: string;
  modifiedLabel?: string;
  language?: string;
  readOnly?: boolean;
  className?: string;
}

export function MonacoDiffViewer({
  originalContent,
  modifiedContent,
  originalLabel = 'Original',
  modifiedLabel = 'Modified',
  language = 'latex',
  readOnly = true,
  className = '',
}: MonacoDiffViewerProps) {
  const diffEditorRef = useRef<Monaco.editor.IStandaloneDiffEditor | null>(null);

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor;
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <DiffEditor
        original={originalContent}
        modified={modifiedContent}
        language={language}
        theme="vs"
        options={{
          readOnly,
          renderSideBySide: false, // Inline diff view like VS Code
          originalEditable: false,
          enableSplitViewResizing: false,
          renderOverviewRuler: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          fontSize: 12,
          wordWrap: 'on',
          folding: false,
          lineNumbers: 'on',
          glyphMargin: false,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}

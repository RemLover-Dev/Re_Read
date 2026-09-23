import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

// Custom theme transparentizing CodeMirror background for glassmorphism
const glassEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'transparent !important',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Vazirmatn', Consolas, monospace",
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit',
  },
  '.cm-content': {
    padding: '16px 20px',
    caretColor: 'var(--color-primary)',
  },
  '.cm-line': {
    lineHeight: '1.75',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--color-primary)',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: 'rgba(0, 0, 0, 0.25) !important',
    color: 'rgba(255, 255, 255, 0.3)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
});

export const CodeMirrorEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { markdownContent, setMarkdownContent } = useWorkspaceStore();

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: markdownContent,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        markdown(),
        oneDark,
        glassEditorTheme,
        EditorView.lineWrapping,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newDoc = update.state.doc.toString();
            setMarkdownContent(newDoc);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Synchronize when document changes from external actions (like resetToSample)
  useEffect(() => {
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== markdownContent) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: markdownContent },
        });
      }
    }
  }, [markdownContent]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-black/20 backdrop-blur-md">
      <div ref={editorRef} className="h-full w-full overflow-hidden" />
    </div>
  );
};

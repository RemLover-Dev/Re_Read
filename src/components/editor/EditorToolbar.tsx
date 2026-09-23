import React from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { Bold, Italic, Code, Sigma, Divide, RefreshCw, Trash2, Heading1, Heading2, List } from 'lucide-react';

export const EditorToolbar: React.FC = () => {
  const { markdownContent, setMarkdownContent, resetToSample } = useWorkspaceStore();

  const insertSnippet = (prefix: string, suffix: string = '') => {
    setMarkdownContent(markdownContent + `\n${prefix}${suffix}\n`);
  };

  const wordsCount = markdownContent.trim() ? markdownContent.trim().split(/\s+/).length : 0;
  const charsCount = markdownContent.length;

  return (
    <div className="h-10 px-4 border-b border-white/10 bg-black/30 backdrop-blur-md flex items-center justify-between text-xs text-slate-300">
      <div className="flex items-center space-x-1">
        <button
          onClick={() => insertSnippet('**', '**')}
          className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('*', '*')}
          className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-white/15 mx-1" />

        <button
          onClick={() => insertSnippet('# ')}
          className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('## ')}
          className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('* ')}
          className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          title="Bulleted List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-white/15 mx-1" />

        <button
          onClick={() => insertSnippet('$E = mc^2$')}
          className="p-1.5 rounded hover:bg-white/10 text-primary hover:text-white transition-colors flex items-center space-x-1"
          title="Inline Math"
        >
          <Sigma className="w-3.5 h-3.5" />
          <span className="text-[10px]">Inline</span>
        </button>
        <button
          onClick={() => insertSnippet('$$\n\\int_{a}^{b} f(x) \\, dx\n$$')}
          className="p-1.5 rounded hover:bg-white/10 text-primary hover:text-white transition-colors flex items-center space-x-1"
          title="Display Math Block"
        >
          <Divide className="w-3.5 h-3.5" />
          <span className="text-[10px]">Block</span>
        </button>
        <button
          onClick={() => insertSnippet('```rust\n// your code here\n```')}
          className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-[11px] text-textMuted font-mono">
          <span>{wordsCount} words</span>
          <span className="mx-1.5">•</span>
          <span>{charsCount} chars</span>
        </div>

        <button
          onClick={resetToSample}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Reset to Sample Document"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Sample</span>
        </button>

        <button
          onClick={() => setMarkdownContent('')}
          className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          title="Clear Editor"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

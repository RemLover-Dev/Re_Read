import React, { useEffect, useState } from 'react';
import { compileBiDiMarkdown } from '../../core/bidi/markdown-pipeline';
import { useThemeStore } from '../../stores/useThemeStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import 'katex/dist/katex.min.css';

export const MarkdownReader: React.FC = () => {
  const { markdownContent, fontScale, isStreamerMode } = useWorkspaceStore();
  const { currentCharacter } = useThemeStore();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    compileBiDiMarkdown(markdownContent).then((html) => {
      if (!isCancelled) {
        setHtmlContent(html);
        setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [markdownContent]);

  return (
    <div
      className={`relative h-full w-full overflow-y-auto p-6 md:p-10 transition-all duration-300 ${
        isStreamerMode ? 'streamer-presentation-mode' : ''
      }`}
      style={{
        fontSize: `${16 * fontScale}px`,
      }}
    >
      {/* Centered Glass Reader Panel */}
      <div
        className="mx-auto max-w-4xl rounded-2xl p-6 sm:p-10 shadow-2xl transition-all duration-300 border"
        style={{
          backgroundColor: currentCharacter.palette.surface,
          borderColor: currentCharacter.palette.borderGlow,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {isLoading && (
          <div className="text-xs text-primary font-mono mb-4 animate-pulse">
            Compiling BiDi LaTeX...
          </div>
        )}

        <article
          className="re-read-content prose prose-invert max-w-none leading-relaxed transition-all"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};

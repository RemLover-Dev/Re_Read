import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

// Unicode Regex for Persian / Arabic / Hebrew Strong RTL characters
const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Detects whether text begins with a strong RTL character under UAX #9 rules
 */
export function detectTextDirection(text: string): 'rtl' | 'ltr' {
  const trimmed = text.trim();
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    // Skip numbers, spaces, and neutral/symbol punctuation
    if (/[\s\d\$\(\)\[\]\{\}\+\-\*\/\=\.\,\:\;\"\'\!\?\_\#\\]/.test(char)) continue;
    return RTL_REGEX.test(char) ? 'rtl' : 'ltr';
  }
  return 'rtl'; // Default to RTL for Persian user workspace
}

/**
 * Custom HAST transformer plugin:
 * 1. Automatically tags block elements (<p>, <h1-h6>, <li>, <blockquote>) with dir="rtl" or dir="ltr"
 * 2. Wraps inline KaTeX math in <bdi dir="ltr" class="katex-isolate">
 * 3. Wraps display KaTeX math in <div dir="ltr" class="katex-display-isolate">
 */
function rehypeBidiIsolator() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      // 1. Process Block Nodes for directionality
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(node.tagName)) {
        const rawText = extractRawText(node);
        const dir = detectTextDirection(rawText);
        node.properties = node.properties || {};
        node.properties.dir = dir;
      }

      // 2. Isolate Inline KaTeX elements
      if (
        node.tagName === 'span' &&
        Array.isArray(node.properties?.className) &&
        node.properties.className.includes('katex')
      ) {
        node.properties.dir = 'ltr';
        node.properties.style = 'unicode-bidi: isolate; display: inline-block; direction: ltr;';
      }

      // 3. Isolate Display KaTeX elements
      if (
        node.tagName === 'span' &&
        Array.isArray(node.properties?.className) &&
        node.properties.className.includes('katex-display')
      ) {
        node.tagName = 'div';
        node.properties.dir = 'ltr';
        node.properties.style = 'unicode-bidi: isolate; text-align: center; direction: ltr; margin: 1.25rem 0;';
      }

      // 4. Isolate inline code tags
      if (node.tagName === 'code') {
        node.properties = node.properties || {};
        node.properties.dir = 'ltr';
      }
    });
  };
}

function extractRawText(node: any): string {
  if (node.type === 'text') return node.value || '';
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractRawText).join('');
  }
  return '';
}

/**
 * Compiles raw Markdown with mixed Persian and LaTeX into directionally-safe HTML
 */
export async function compileBiDiMarkdown(markdown: string): Promise<string> {
  if (!markdown || !markdown.trim()) {
    return '<p class="text-textMuted italic">No content yet. Start typing in the editor or load a sample document.</p>';
  }

  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex as any, {
        output: 'htmlAndMathml',
        strict: false,
        throwOnError: false,
      })
      .use(rehypeBidiIsolator)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdown);

    return String(file);
  } catch (err) {
    console.error('Markdown compilation error:', err);
    return `<div class="p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-sm">
      <strong>Compilation Notice:</strong> ${(err as Error).message}
    </div>`;
  }
}

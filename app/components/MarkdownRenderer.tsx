"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { memo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * A distinctive markdown renderer with refined typography
 * Designed for the prompt-dir aesthetic: dark, editorial, precise
 */
const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Headings - Editorial serif style
          h1: ({ children }) => (
            <h1 className="font-serif text-3xl font-light text-white mb-6 mt-8 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif text-2xl font-light text-white mb-4 mt-6 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif text-xl font-light text-neutral-200 mb-3 mt-5 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-mono text-sm uppercase tracking-wider text-emerald-400 mb-2 mt-4 first:mt-0">
              {children}
            </h4>
          ),
          
          // Paragraphs - Clean, readable
          p: ({ children }) => (
            <p className="text-neutral-300 leading-relaxed mb-4 last:mb-0">
              {children}
            </p>
          ),
          
          // Links - Subtle emerald accent
          a: ({ href, children }) => {
            if (!href || typeof href !== 'string') {
              return <span className="text-neutral-400">{children}</span>;
            }
            
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 border-b border-emerald-500/30 hover:border-emerald-400 transition-colors"
              >
                {children}
              </a>
            );
          },
          
          // Lists - Properly styled
          ul: ({ children }) => (
            <ul className="list-none space-y-2 mb-4 pl-4 border-l-2 border-neutral-800">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 mb-4 pl-6 marker:text-neutral-500">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-neutral-300 leading-relaxed pl-2">
              <span className="text-emerald-500 mr-2">—</span>
              {children}
            </li>
          ),
          
          // Code blocks - Terminal aesthetic
          pre: ({ children }) => (
            <pre className="bg-neutral-900 border border-neutral-800 p-4 overflow-x-auto mb-4 text-sm leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-neutral-800/50 text-emerald-300 px-1.5 py-0.5 font-mono text-sm border border-neutral-700/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={`font-mono ${className || ""}`} {...props}>
                {children}
              </code>
            );
          },
          
          // Blockquotes - Editorial style
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500/50 pl-6 py-2 my-4 bg-neutral-900/30 italic text-neutral-400">
              {children}
            </blockquote>
          ),
          
          // Horizontal rule - Minimal
          hr: () => (
            <hr className="border-neutral-800 my-8" />
          ),
          
          // Tables - Clean grid
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-neutral-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-900/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-neutral-800 px-4 py-2 text-left font-mono text-sm text-emerald-400">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-neutral-800 px-4 py-2 text-sm text-neutral-300">
              {children}
            </td>
          ),
          
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-neutral-200">{children}</em>
          ),
          
          // Delete/strikethrough
          del: ({ children }) => (
            <del className="line-through text-neutral-500">{children}</del>
          ),
          
          // Images
          img: ({ src, alt }) => (
            <figure className="my-6">
              <img
                src={src}
                alt={alt}
                className="w-full border border-neutral-800"
              />
              {alt && (
                <figcaption className="mt-2 text-center font-mono text-xs text-neutral-500">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default MarkdownRenderer;

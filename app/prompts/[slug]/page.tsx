"use client";

import { getPrompt } from "@/app/actions";
import Link from "next/link";
import { useState, useEffect } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
    >
      {copied ? (
        <>
          <span>✓</span>
          COPIED
        </>
      ) : (
        <>
          COPY PROMPT
        </>
      )}
    </button>
  );
}

export default function PromptPage({ params }: PageProps) {
  const [prompt, setPrompt] = useState<ReturnType<typeof getPrompt> extends Promise<infer R> ? R extends { prompt: infer P } ? P : null : null | null>(null);
  const [sections, setSections] = useState<ReturnType<typeof getPrompt> extends Promise<infer R> ? R extends { sections: infer S } ? S : [] : []>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrompt() {
      try {
        const { slug } = await params;
        const result = await getPrompt(slug);
        
        if ("error" in result) {
          setError(result.error ?? null);
        } else {
          setPrompt(result.prompt);
          setSections(result.sections);
        }
      } catch (err) {
        setError("Failed to load prompt");
      } finally {
        setLoading(false);
      }
    }
    loadPrompt();
  }, [params]);

  const fullPromptText = sections
    .map(s => `<${s.section_type}>\n${s.content}\n</${s.section_type}>`)
    .join('\n\n');

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <main className="mx-auto max-w-4xl px-6 py-24">
          <div className="font-mono text-sm text-neutral-500">Loading...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <main className="mx-auto max-w-4xl px-6 py-24">
          <Link 
            href="/prompts" 
            className="mb-8 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
          >
            ← BACK TO LIBRARY
          </Link>
          <h1 className="font-serif text-4xl text-white">Error</h1>
          <p className="mt-4 font-mono text-sm text-neutral-400">{error}</p>
        </main>
      </div>
    );
  }

  if (!prompt) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Noise texture overlay */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient orbs */}
      <div className="pointer-events-none fixed -right-32 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <main className="relative mx-auto max-w-4xl px-6 py-24">
        {/* Back link */}
        <Link 
          href="/prompts" 
          className="mb-12 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
        >
          ← BACK TO LIBRARY
        </Link>

        {/* Header */}
        <header className="mb-16 border-b border-neutral-800 pb-12">
          <div className="flex items-start justify-between gap-8">
            <h1 className="font-serif text-5xl font-light text-white lg:text-6xl">
              {prompt.title}
            </h1>
            <CopyButton text={fullPromptText} />
          </div>
          
          {prompt.description && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400">
              {prompt.description}
            </p>
          )}
          
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {prompt.tags.map((tag: string) => (
                <span 
                  key={tag}
                  className="border border-neutral-800 bg-neutral-900/50 px-3 py-1 font-mono text-xs text-neutral-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Sections */}
        <article className="space-y-12">
          {sections.map((section) => (
            <section 
              key={section.id}
              className="border-l-2 border-neutral-800 pl-8 transition-colors hover:border-emerald-500/50"
            >
              <div className="mb-4 flex items-center gap-3">
                <code className="font-mono text-sm text-emerald-500">
                  &lt;{section.section_type}&gt;
                </code>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>
              <div className="bg-neutral-900/30 p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-neutral-300">
                  {section.content}
                </pre>
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <div className="h-px flex-1 bg-neutral-800" />
                <code className="font-mono text-sm text-emerald-500">
                  &lt;/{section.section_type}&gt;
                </code>
              </div>
            </section>
          ))}
        </article>

        {/* Footer */}
        <footer className="mt-24 border-t border-neutral-800 pt-8">
          <p className="font-mono text-xs text-neutral-600">
            Created on {new Date(prompt.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </footer>
      </main>
    </div>
  );
}

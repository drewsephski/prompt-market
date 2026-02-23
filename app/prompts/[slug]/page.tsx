"use client";

import { getPrompt } from "@/app/actions";
import Link from "next/link";
import { useState, useEffect } from "react";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function DeleteButton({ slug, onDelete }: { slug: string; onDelete: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this prompt? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/prompts/${slug}/delete`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onDelete();
        window.location.href = '/prompts';
      } else {
        alert('Failed to delete prompt');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete prompt');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-sm text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? "DELETING..." : "⟲ DELETE"}
    </button>
  );
}

function PrivacyToggle({ slug, isPrivate, onToggle }: { slug: string; isPrivate: boolean; onToggle: (isPrivate: boolean) => void }) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/prompts/${slug}/privacy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: !isPrivate })
      });
      
      if (response.ok) {
        const result = await response.json();
        onToggle(result.isPrivate);
      } else {
        alert('Failed to update privacy');
      }
    } catch (error) {
      console.error('Privacy toggle error:', error);
      alert('Failed to update privacy');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className="inline-flex items-center gap-2 border border-neutral-500/30 bg-neutral-500/10 px-4 py-2 font-mono text-sm text-neutral-400 transition-all hover:border-neutral-500/50 hover:bg-neutral-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isToggling ? "UPDATING..." : (isPrivate ? "⚡ MAKE PUBLIC" : "🔒 MAKE PRIVATE")}
    </button>
  );
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

function AddToChatButton({ text }: { text: string }) {
  const handleAddToChat = () => {
    const encodedPrompt = encodeURIComponent(text);
    window.open(`/chat?prompt=${encodedPrompt}`, '_blank');
  };

  return (
    <button
      onClick={handleAddToChat}
      className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-900/50 px-4 py-2 font-mono text-sm text-neutral-400 transition-all hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-200"
    >
      ADD TO CHAT
    </button>
  );
}

export default function PromptPage({ params }: PageProps) {
  const [prompt, setPrompt] = useState<ReturnType<typeof getPrompt> extends Promise<infer R> ? R extends { prompt: infer P } ? P : null : null | null>(null);
  const [sections, setSections] = useState<ReturnType<typeof getPrompt> extends Promise<infer R> ? R extends { sections: infer S } ? S : [] : []>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

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
          setIsOwner(result.isOwner || false);
          setIsPrivate(result.prompt?.is_private || false);
        }
      } catch {
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
        {/* Atmospheric background */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <main className="relative mx-auto max-w-4xl px-6 py-24">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-mono text-sm text-neutral-500">Loading prompt...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <main className="relative mx-auto max-w-4xl px-6 py-24">
          <Link
            href="/prompts"
            className="mb-8 inline-flex items-center gap-2 font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
          >
            <span>←</span>
            <span>BACK TO LIBRARY</span>
          </Link>
          <div className="border border-red-500/30 bg-red-500/10 p-8">
            <h1 className="font-serif text-4xl text-white mb-4">Error</h1>
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!prompt) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Atmospheric background layers */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient orbs */}
      <div className="pointer-events-none fixed -right-64 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-b from-indigo-600/8 via-purple-500/5 to-transparent blur-3xl" />
      <div className="pointer-events-none fixed -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-emerald-600/6 to-transparent blur-3xl" />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <main className="relative mx-auto max-w-4xl px-6 py-12 lg:py-16">
        {/* Back link */}
        <Link
          href="/prompts"
          className="mb-12 inline-flex items-center gap-2 font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400 group"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          <span>BACK TO LIBRARY</span>
        </Link>

        {/* Header */}
        <header className="mb-16">
          <div className="flex items-start justify-between gap-8 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 border border-neutral-800 bg-neutral-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400">◈</span>
                </div>
                {isPrivate && (
                  <span className="inline-flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-400">
                    <span>⚡</span>
                    <span>PRIVATE</span>
                  </span>
                )}
              </div>
              <h1 className="font-serif text-4xl font-light text-white lg:text-5xl tracking-tight">
                {prompt.title}
              </h1>
              {prompt.description && (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400">
                  {prompt.description}
                </p>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              <div className="flex gap-3">
                <CopyButton text={fullPromptText} />
                <AddToChatButton text={fullPromptText} />
              </div>
              
              {/* Owner Actions */}
              {isOwner && (
                <div className="flex gap-2">
                  <PrivacyToggle 
                    slug={prompt.slug!} 
                    isPrivate={isPrivate} 
                    onToggle={setIsPrivate} 
                  />
                  <DeleteButton 
                    slug={prompt.slug!} 
                    onDelete={() => window.location.href = '/prompts'} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {prompt.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="border border-neutral-800 bg-neutral-900/30 px-3 py-1 font-mono text-xs text-neutral-500 hover:text-neutral-400 hover:border-neutral-700 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Sections */}
        <article className="space-y-8">
          {sections.map((section, index) => (
            <section
              key={section.id}
              className="relative group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Left border accent */}
              <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <code className="font-mono text-sm text-emerald-400 bg-emerald-500/10 px-2 py-1 border border-emerald-500/20">
                  {`<${section.section_type}>`}
                </code>
                <div className="flex-1 h-px bg-neutral-800/50" />
              </div>
              
              {/* Content with markdown rendering */}
              <div className="bg-neutral-900/30 border border-neutral-800/60 p-6 rounded-sm backdrop-blur-sm">
                <MarkdownRenderer content={section.content} />
              </div>
              
              {/* Section footer */}
              <div className="flex items-center justify-end gap-3 mt-4">
                <div className="h-px flex-1 bg-neutral-800/50" />
                <code className="font-mono text-sm text-emerald-400/60">
                  {`</${section.section_type}>`}
                </code>
              </div>
            </section>
          ))}
        </article>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-neutral-800/50">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-neutral-600">
              Created on {prompt.created_at ? new Date(prompt.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Unknown date'}
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-neutral-700">
                MARKDOWN ENABLED
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

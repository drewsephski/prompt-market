"use client";

import { listPrompts } from "@/app/actions";
import AuthNav from "@/app/components/AuthNav";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

interface Prompt {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  created_at: string;
}

const FILTER_STYLES: Record<string, { active: string; count: string; hover: string }> = {
  all: {
    active: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    count: "text-emerald-500/60",
    hover: "group-hover:text-emerald-400",
  },
  frontend: {
    active: "border-rose-500/50 bg-rose-500/10 text-rose-400",
    count: "text-rose-500/60",
    hover: "group-hover:text-rose-400",
  },
  backend: {
    active: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    count: "text-blue-500/60",
    hover: "group-hover:text-blue-400",
  },
  ai: {
    active: "border-violet-500/50 bg-violet-500/10 text-violet-400",
    count: "text-violet-500/60",
    hover: "group-hover:text-violet-400",
  },
  founder: {
    active: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    count: "text-amber-500/60",
    hover: "group-hover:text-amber-400",
  },
  forensic: {
    active: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
    count: "text-cyan-500/60",
    hover: "group-hover:text-cyan-400",
  },
  creative: {
    active: "border-pink-500/50 bg-pink-500/10 text-pink-400",
    count: "text-pink-500/60",
    hover: "group-hover:text-pink-400",
  },
  security: {
    active: "border-red-500/50 bg-red-500/10 text-red-400",
    count: "text-red-500/60",
    hover: "group-hover:text-red-400",
  },
  data: {
    active: "border-teal-500/50 bg-teal-500/10 text-teal-400",
    count: "text-teal-500/60",
    hover: "group-hover:text-teal-400",
  },
};

const FILTER_CATEGORIES = {
  all: { label: "All", icon: "◆" },
  frontend: { label: "Frontend", icon: "◈" },
  backend: { label: "Backend", icon: "◉" },
  ai: { label: "AI / SDK", icon: "◊" },
  founder: { label: "Founder", icon: "◆" },
  forensic: { label: "Forensic", icon: "⌕" },
  creative: { label: "Creative", icon: "✧" },
  security: { label: "Security", icon: "⚿" },
  data: { label: "Data", icon: "▤" },
};

const TAG_MAPPING: Record<string, string[]> = {
  frontend: ["frontend", "react", "shadcn", "tailwind", "design-system", "ui", "components", "javascript", "typescript"],
  backend: ["backend", "api", "fullstack", "architecture", "devops", "graphql", "rest", "web-dev"],
  ai: ["ai-sdk", "ai-agent", "agents", "llm", "streaming", "tools", "tool-calling", "automation", "workflows", "vercel"],
  founder: ["founder", "startup", "validation", "mvp", "pitch", "fundraising", "interview", "career"],
  forensic: ["forensic", "investigation", "analysis", "linguistics", "legal", "audit", "analyst", "investigator", "detective"],
  creative: ["creative", "writing", "storytelling", "marketing", "copywriting", "design", "art"],
  security: ["security", "cybersecurity", "infosec", "vulnerability", "pentesting", "hacking"],
  data: ["data", "analytics", "sql", "database", "python", "machine-learning", "statistics"],
};

function getCategoryForTags(tags: string[]): string {
  for (const [category, categoryTags] of Object.entries(TAG_MAPPING)) {
    if (tags.some(tag => categoryTags.includes(tag))) {
      return category;
    }
  }
  return "other";
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadPrompts = async () => {
    try {
      const result = await listPrompts();
      if ("prompts" in result) {
        setPrompts(result.prompts ?? []);
      } else if ("error" in result) {
        console.error("Failed to load prompts:", result.error);
      }
    } catch (err) {
      console.error("Failed to load prompts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/cron/generate-prompt", {
        method: "POST",
      });
      if (res.ok) {
        await loadPrompts();
      } else {
        console.error("Failed to generate prompt:", await res.text());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };


  const filteredPrompts = useMemo(() => {
    if (activeFilter === "all") return prompts;
    return prompts.filter(prompt => getCategoryForTags(prompt.tags) === activeFilter);
  }, [prompts, activeFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: prompts.length };
    for (const category of Object.keys(TAG_MAPPING)) {
      c[category] = prompts.filter(p => getCategoryForTags(p.tags) === category).length;
    }
    return c;
  }, [prompts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <main className="mx-auto max-w-5xl px-6 py-24">
          <div className="font-mono text-sm text-neutral-500">Loading prompts...</div>
        </main>
      </div>
    );
  }

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
      <div className="pointer-events-none fixed -left-32 top-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <main className="relative mx-auto max-w-5xl px-6 py-24">
        <header className="mb-12 flex flex-col items-start gap-4 border-b border-neutral-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-2 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
            >
              ← BACK TO HOME
            </Link>
            <h1 className="font-serif text-5xl font-light text-white">
              All Prompts
            </h1>
            <p className="mt-2 font-mono text-sm text-neutral-500">
              {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} in the library
            </p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <AuthNav />
            <button
              onClick={handleGeneratePrompt}
              disabled={isGenerating}
              className="inline-flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "GENERATING..." : "✨ AUTOGENERATE PROMPT"}
            </button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="mb-12 flex flex-wrap gap-2">
          {Object.entries(FILTER_CATEGORIES).map(([key, { label, icon }]) => {
            const isActive = activeFilter === key;
            const count = counts[key] || 0;
            const styles = FILTER_STYLES[key];

            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`
                  group flex items-center gap-2 border px-4 py-2 font-mono text-xs tracking-wider transition-all
                  ${isActive
                    ? styles.active
                    : 'border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'
                  }
                `}
              >
                <span className="opacity-60">{icon}</span>
                <span>{label}</span>
                <span className={`ml-1 ${isActive ? styles.count : 'text-neutral-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="border border-neutral-800 bg-neutral-900/30 p-12 text-center">
            <p className="font-mono text-neutral-400">
              {activeFilter === "all" ? "No prompts yet." : `No ${FILTER_CATEGORIES[activeFilter as keyof typeof FILTER_CATEGORIES]?.label.toLowerCase() || ''} prompts.`}
            </p>
            {activeFilter === "all" && (
              <Link
                href="/create"
                className="mt-4 inline-block font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Create the first one →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map((prompt, i) => {
              const category = getCategoryForTags(prompt.tags);
              const categoryColor = {
                frontend: 'group-hover:text-rose-400',
                backend: 'group-hover:text-blue-400',
                ai: 'group-hover:text-violet-400',
                founder: 'group-hover:text-amber-400',
                forensic: 'group-hover:text-cyan-400',
                creative: 'group-hover:text-pink-400',
                security: 'group-hover:text-red-400',
                data: 'group-hover:text-teal-400',
                other: 'group-hover:text-emerald-400',
              }[category] || 'group-hover:text-emerald-400';

              return (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="group relative border border-neutral-800 bg-neutral-900/30 p-8 transition-all hover:border-neutral-700 hover:bg-neutral-900/50"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Index number */}
                  <div className="absolute right-4 top-4 font-mono text-xs text-neutral-700 transition-colors group-hover:text-neutral-500">
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  <h2 className={`font-serif text-2xl text-white transition-colors ${categoryColor}`}>
                    {prompt.title}
                  </h2>

                  {prompt.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-400">
                      {prompt.description}
                    </p>
                  )}

                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {prompt.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="font-mono text-xs text-neutral-500"
                        >
                          #{tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="font-mono text-xs text-neutral-600">
                          +{prompt.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hover indicator */}
                  <div className="absolute bottom-4 right-4 font-mono text-xs text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100">
                    VIEW →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {!isLoading && filteredPrompts.length > 0 && (
          <div className="mt-16 flex items-center gap-6 border-t border-white/[0.04] pt-8">
            <span className="font-mono text-[10px] tracking-widest text-neutral-700">
              END OF RESULTS
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/[0.04] to-transparent" />
          </div>
        )}
      </main>
    </div>
  );
}


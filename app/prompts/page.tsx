"use client";

import { listPrompts } from "@/app/actions";
import { createBrowserClient } from "@/lib/supabase/client";
import AuthNav from "@/app/components/AuthNav";
import ComplexitySelector from "@/app/components/ComplexitySelector";
import { categorizePrompt, getCategories, getCategoryStyles, getCategoryColor } from "@/lib/categorization";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Prompt {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  created_at: string;
  created_by: string;
  is_private?: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function DeleteModal({ isOpen, onClose, onConfirm, promptTitle }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  promptTitle: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-md mx-4">
        <h2 className="font-serif text-xl text-white mb-4">Delete Prompt</h2>
        <p className="text-neutral-300 mb-6">
          Are you sure you want to delete &quot;<span className="text-emerald-400">{promptTitle}</span>&quot;? 
          This action cannot be undone.
        </p>   
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-600 hover:text-neutral-300 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 font-mono text-sm text-white bg-red-500 border border-red-600 hover:bg-red-600 hover:border-red-500 transition-colors"
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const bgColor = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  }[toast.type];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
      <div className={`border ${bgColor} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md`}>
        <div className="flex-shrink-0">
          {toast.type === 'success' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-8 8 0 018 0zm3.707-9.293a1 1 0 00-1.414 1.414l-4-4a1 1 0 00-1.414 1.414V10a1 1 0 001.414-1.414l4-4a1 1 0 001.414-1.414z" clipRule="evenodd"/>
            </svg>
          )}
          {toast.type === 'error' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-8 8 0 018 0zM8.707 7.293a3 3 0 00-4.243 4.243l1.414 1.414H10a1 1 0 011.414-1.414l-1.414-1.414a1 1 0 004.243-4.243l-1.414-1.414H8a1 1 0 00-1.414 1.414L8.707 7.293a3 3 0 004.243-4.243z" clipRule="evenodd"/>
            </svg>
          )}
          {toast.type === 'info' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 11-2 0 1 1 0 012 0z"/>
            </svg>
          )}
        </div>
        <div className="flex-shrink-0 font-mono text-sm">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-neutral-400 hover:text-neutral-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 1.414L10 10.586l4.293 4.293a1 1 0 00-1.414-1.414L4.293 4.293zM4.293 15.707a1 1 0 011.414 1.414L10 5.414l4.293 4.293a1 1 0 00-1.414-1.414L4.293 15.707z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

const FILTER_CATEGORIES = getCategories();
const FILTER_STYLES = getCategoryStyles();

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComplexitySelector, setShowComplexitySelector] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; promptId: string; promptTitle: string }>({ isOpen: false, promptId: '', promptTitle: '' });
  const [toast, setToast] = useState<Toast | null>(null);

  // Get current user ID for "My Prompts" filter
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load prompts
  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const result = await listPrompts();
      if ('error' in result) {
        console.error('Failed to load prompts:', result.error);
        setToast({ id: Date.now().toString(), message: 'Failed to load prompts', type: 'error' });
      } else {
        setPrompts(result.prompts);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
      setToast({ id: Date.now().toString(), message: 'Error loading prompts', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load prompts on component mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const handleDelete = (promptId: string, promptTitle: string) => {
    // Find the prompt to get its slug
    const prompt = prompts.find(p => p.id === promptId);
    if (prompt) {
      setDeleteModal({ isOpen: true, promptId: prompt.slug, promptTitle });
    }
  };

  const handleGeneratePrompt = async (idea: string, complexity: 'simple' | 'complex' | 'visionary') => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea, complexity }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setToast({ 
          id: Date.now().toString(), 
          message: `${result.title} (${complexity}) generated successfully!`, 
          type: 'success' 
        });
        setShowComplexitySelector(false);
        // Reload prompts to show the new one
        loadPrompts();
      } else {
        setToast({ id: Date.now().toString(), message: result.error || 'Failed to generate prompt', type: 'error' });
      }
    } catch (error) {
      console.error('Generate prompt error:', error);
      setToast({ id: Date.now().toString(), message: 'Failed to generate prompt', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/prompts/${deleteModal.promptId}/delete`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setToast({ id: Date.now().toString(), message: 'Prompt deleted successfully', type: 'success' });
        // Reload prompts to get the updated list
        await loadPrompts();
      } else {
        setToast({ id: Date.now().toString(), message: 'Failed to delete prompt', type: 'error' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setToast({ id: Date.now().toString(), message: 'Failed to delete prompt', type: 'error' });
    } finally {
      setDeleteModal({ isOpen: false, promptId: '', promptTitle: '' });
    }
  };

  // Calculate counts for each filter category
  const counts = {
    all: prompts.length,
    my: userId ? prompts.filter(p => p.created_by === userId).length : 0,
    architecture: prompts.filter(p => categorizePrompt(p.tags, p.title, p.description) === 'architecture').length,
    ai: prompts.filter(p => categorizePrompt(p.tags, p.title, p.description) === 'ai').length,
    philosophy: prompts.filter(p => categorizePrompt(p.tags, p.title, p.description) === 'philosophy').length,
    frontend: prompts.filter(p => categorizePrompt(p.tags, p.title, p.description) === 'frontend').length,
    forensic: prompts.filter(p => categorizePrompt(p.tags, p.title, p.description) === 'forensic').length,
    business: prompts.filter(p => categorizePrompt(p.tags, p.title, p.description) === 'business').length,
    other: prompts.filter(p => categorizePrompt(p.tags, p.title, p.description) === 'other').length,
  };

  // Filter prompts based on active filter
  const filteredPrompts = activeFilter === "all" 
    ? prompts 
    : activeFilter === "my" 
    ? prompts.filter(p => p.created_by === userId)
    : prompts.filter(p => categorizePrompt(p.tags, p.title, p.description) === activeFilter);

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
              {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} in library
              {prompts.length < 26 && (
                <span className="ml-2 text-yellow-400">
                  (Debug: Expected 26, got {prompts.length})
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <AuthNav />
            <div className="flex gap-2">
              <button
                onClick={() => setShowComplexitySelector(true)}
                disabled={isGenerating}
                className="inline-flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "GENERATING..." : "⚡ GENERATE PROMPT"}
              </button>
            </div>
          </div>
        </header>

        {/* Complexity Selector - Always Visible */}
        <div className="mb-12">
          <ComplexitySelector
            onGenerate={handleGeneratePrompt}
            isGenerating={isGenerating}
          />
        </div>

        {/* Filter Bar */}
        <div className="mb-12 flex flex-wrap gap-2">
          {Object.entries(FILTER_CATEGORIES).map(([key, { label, icon }]) => {
            const isActive = activeFilter === key;
            const count = counts[key as keyof typeof counts] || 0;
            const styles = FILTER_STYLES[key as keyof typeof FILTER_STYLES];

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

        {/* Delete Modal */}
        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, promptId: '', promptTitle: '' })}
          onConfirm={confirmDelete}
          promptTitle={deleteModal.promptTitle}
        />

        {/* Toast Notification */}
        <Toast
          toast={toast}
          onClose={() => setToast(null)}
        />

        {/* Complexity Selector Modal */}
        {showComplexitySelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl text-white">Generate Custom Prompt</h2>
                  <button
                    onClick={() => setShowComplexitySelector(false)}
                    className="text-neutral-400 hover:text-neutral-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <ComplexitySelector
                  onGenerate={handleGeneratePrompt}
                  isGenerating={isGenerating}
                />
              </div>
            </div>
          </div>
        )}

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
              const category = categorizePrompt(prompt.tags, prompt.title, prompt.description);
              const categoryColor = getCategoryColor(category);

              return (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="group relative border border-neutral-800 bg-neutral-900/30 p-8 transition-all hover:border-neutral-700 hover:bg-neutral-900/50"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Delete button for user's own prompts */}
                  {prompt.created_by === userId && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(prompt.id, prompt.title);
                      }}
                      className="absolute top-4 left-4 font-mono text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 inline-flex items-center gap-1 border border-red-500/30 bg-red-500/10 px-2 py-1 hover:border-red-500/50 hover:bg-red-500/20"
                      title="Delete prompt"
                    >
                      ⟲
                    </button>
                  )}

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


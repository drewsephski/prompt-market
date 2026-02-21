"use client";

import { createPrompt } from "@/app/actions";
import { autofillPrompt, enhancePrompt } from "@/app/ai-actions";
import { createBrowserClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const VALID_SECTIONS = [
  "Role",
  "Context",
  "Instructions",
  "Constraints",
  "Output_Format",
  "User_Input",
];

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [ideaInput, setIdeaInput] = useState("");

  // Form refs for AI autofill
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const rawPromptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setErrors({});

    const result = await createPrompt(formData);

    if (result.error) {
      setErrors(result.error as Record<string, string[]>);
      setIsSubmitting(false);
    } else if (result.success) {
      router.push(`/prompts/${result.slug}`);
    }
  }

  async function handleAutofill() {
    if (!ideaInput.trim()) return;

    setIsAutoFilling(true);
    setErrors({});

    try {
      const result = await autofillPrompt(ideaInput);

      if (titleRef.current) titleRef.current.value = result.title;
      if (descriptionRef.current) descriptionRef.current.value = result.description;
      if (tagsRef.current) tagsRef.current.value = result.tags.join(", ");
      if (rawPromptRef.current) rawPromptRef.current.value = result.rawPrompt;

      setIdeaInput("");
    } catch (_err) {
      setErrors({
        ai: ["Failed to autofill. Please try again or enter manually."],
      });
    } finally {
      setIsAutoFilling(false);
    }
  }

  async function handleEnhance() {
    const currentContent = rawPromptRef.current?.value || "";
    if (!currentContent.trim()) {
      setErrors({
        ai: ["Please enter some prompt content to enhance"],
      });
      return;
    }

    setIsEnhancing(true);
    setErrors({});

    try {
      const enhanced = await enhancePrompt(currentContent);
      if (rawPromptRef.current) rawPromptRef.current.value = enhanced;
    } catch (_err) {
      setErrors({
        ai: ["Failed to enhance prompt. Please try again."],
      });
    } finally {
      setIsEnhancing(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-24">
          <div className="font-mono text-sm text-neutral-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Not authenticated - show sign in wall
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        {/* Noise texture overlay */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <main className="relative mx-auto max-w-3xl px-6 py-24">
          {/* Back link */}
          <Link
            href="/prompts"
            className="mb-12 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
          >
            ← BACK TO LIBRARY
          </Link>

          <div className="border border-neutral-800 bg-neutral-900/30 p-12 text-center">
            <div className="mb-6 text-4xl">🔒</div>
            <h1 className="mb-4 font-serif text-3xl text-white">
              Sign In Required
            </h1>
            <p className="mb-8 font-mono text-sm text-neutral-400">
              You need to be signed in to create prompts in the library.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
            >
              SIGN IN →
            </Link>
          </div>
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

      {/* Gradient orb */}
      <div className="pointer-events-none fixed -right-32 top-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -left-32 bottom-1/4 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <main className="relative mx-auto max-w-3xl px-6 py-24">
        {/* Back link */}
        <Link 
          href="/prompts" 
          className="mb-12 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
        >
          ← BACK TO LIBRARY
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="font-serif text-5xl font-light text-white">
            Create Prompt
          </h1>
          <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-neutral-400">
            Add a structured prompt to the library. Use AI assistance to autofill from an idea or enhance your prompt.
          </p>
        </header>

        {/* AI Autofill */}
        <div className="mb-12 border border-indigo-500/20 bg-indigo-950/10 p-6">
          <h3 className="mb-4 font-mono text-xs tracking-widest text-indigo-400">
            ✨ AI AUTOFILL
          </h3>
          <p className="mb-4 text-sm text-neutral-400">
            Describe what you want the prompt to do, and AI will generate the complete structured prompt.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="e.g., Help write technical documentation for my API's"
              className="flex-1 border border-neutral-800 bg-neutral-900/50 px-4 py-3 font-mono text-sm text-white placeholder-neutral-600 transition-colors focus:border-indigo-500/50 focus:outline-none"
            />
            <button
              onClick={handleAutofill}
              disabled={isAutoFilling || !ideaInput.trim()}
              className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 px-6 py-3 font-mono text-sm text-indigo-400 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAutoFilling ? (
                <span className="animate-pulse">GENERATING...</span>
              ) : (
                <>
                  <span>✨</span>
                  AUTOFILL
                </>
              )}
            </button>
          </div>
        </div>

        {errors.ai && (
          <div className="mb-8 border border-red-500/30 bg-red-950/10 p-4">
            <p className="font-mono text-xs text-red-400">{errors.ai[0]}</p>
          </div>
        )}

        {/* Valid sections reference */}
        <div className="mb-12 border border-neutral-800 bg-neutral-900/30 p-6">
          <h3 className="mb-4 font-mono text-xs tracking-widest text-neutral-500">
            VALID SECTIONS
          </h3>
          <div className="flex flex-wrap gap-3">
            {VALID_SECTIONS.map((section) => (
              <code 
                key={section}
                className={`text-xs ${
                  section === 'Role' || section === 'Instructions' 
                    ? 'text-emerald-400' 
                    : 'text-neutral-500'
                }`}
              >
                &lt;{section}&gt;
                {(section === 'Role' || section === 'Instructions') && (
                  <span className="text-neutral-600"> *</span>
                )}
              </code>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            * Required sections
          </p>
        </div>

        <form action={handleSubmit} className="space-y-8">
          {/* Title */}
          <div className="space-y-3">
            <label
              htmlFor="title"
              className="block font-mono text-xs tracking-widest text-neutral-500"
            >
              TITLE *
            </label>
            <input
              ref={titleRef}
              type="text"
              id="title"
              name="title"
              required
              placeholder="My Prompt"
              className="w-full border border-neutral-800 bg-neutral-900/30 px-4 py-3 font-mono text-sm text-white placeholder-neutral-600 transition-colors focus:border-emerald-500/50 focus:outline-none"
            />
            {errors.title && (
              <p className="font-mono text-xs text-red-400">{errors.title[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label
              htmlFor="description"
              className="block font-mono text-xs tracking-widest text-neutral-500"
            >
              DESCRIPTION
            </label>
            <input
              ref={descriptionRef}
              type="text"
              id="description"
              name="description"
              placeholder="Brief description of what this prompt does"
              className="w-full border border-neutral-800 bg-neutral-900/30 px-4 py-3 font-mono text-sm text-white placeholder-neutral-600 transition-colors focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label
              htmlFor="tags"
              className="block font-mono text-xs tracking-widest text-neutral-500"
            >
              TAGS
            </label>
            <input
              ref={tagsRef}
              type="text"
              id="tags"
              name="tags"
              placeholder="writing, coding, analysis (comma separated)"
              className="w-full border border-neutral-800 bg-neutral-900/30 px-4 py-3 font-mono text-sm text-white placeholder-neutral-600 transition-colors focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {/* Prompt Content */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="rawPrompt"
                className="block font-mono text-xs tracking-widest text-neutral-500"
              >
                PROMPT CONTENT *
              </label>
              <button
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnhancing ? (
                  <span className="animate-pulse">ENHANCING...</span>
                ) : (
                  <>
                    <span>✨</span>
                    ENHANCE WITH AI
                  </>
                )}
              </button>
            </div>
            <textarea
              ref={rawPromptRef}
              id="rawPrompt"
              name="rawPrompt"
              required
              rows={20}
              placeholder={`<Role>...</Role>
<Context>...</Context>
<Instructions>...</Instructions>
<Constraints>...</Constraints>
<Output_Format>...</Output_Format>

<!-- 👇 WHERE USERS ENTER THEIR INPUT -->
<User_Input>...</User_Input>`}
              className="w-full border border-neutral-800 bg-neutral-900/30 px-4 py-3 font-mono text-sm text-white placeholder-neutral-600 transition-colors focus:border-emerald-500/50 focus:outline-none resize-y"
            />
            {errors.rawPrompt && (
              <p className="font-mono text-xs text-red-400">{errors.rawPrompt[0]}</p>
            )}
            {errors.database && (
              <p className="font-mono text-xs text-red-400">{errors.database[0]}</p>
            )}
            {errors.auth && (
              <p className="font-mono text-xs text-red-400">{errors.auth[0]}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-pulse">CREATING...</span>
                </>
              ) : (
                <>
                  <span>+</span>
                  CREATE PROMPT
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

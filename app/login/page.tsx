"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const successMessage = searchParams.get('message');

  useEffect(() => {
    async function checkAuth() {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        router.push("/prompts");
      }
    }
    checkAuth();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/prompts");
      router.refresh();
    }
  }

  if (user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto flex max-w-md items-center justify-center px-6 py-24">
          <div className="font-mono text-sm text-neutral-500">Redirecting...</div>
        </div>
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

      <main className="relative mx-auto max-w-md px-6 py-24">
        {/* Back link */}
        <Link
          href="/prompts"
          className="mb-12 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
        >
          ← BACK TO LIBRARY
        </Link>

        <div className="border border-neutral-800 bg-neutral-900/30 p-8">
          <h1 className="mb-2 font-serif text-3xl text-white">Sign In</h1>
          <p className="mb-8 font-mono text-sm text-neutral-400">
            Welcome back to the Prompt Library
          </p>

          {successMessage && (
            <div className="mb-6 border border-emerald-500/30 bg-emerald-950/10 p-4">
              <p className="font-mono text-xs text-emerald-400">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 border border-red-500/30 bg-red-950/10 p-4">
              <p className="font-mono text-xs text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="email"
                className="block font-mono text-xs tracking-widest text-neutral-500"
              >
                EMAIL
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-neutral-800 bg-neutral-900/50 px-4 py-3 font-mono text-sm text-white placeholder-neutral-600 transition-colors focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="password"
                className="block font-mono text-xs tracking-widest text-neutral-500"
              >
                PASSWORD
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-neutral-800 bg-neutral-900/50 px-4 py-3 font-mono text-sm text-white placeholder-neutral-600 transition-colors focus:border-emerald-500/50 focus:outline-none"
              />
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="font-mono text-xs text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-pulse">SIGNING IN...</span>
              ) : (
                "SIGN IN →"
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-neutral-800 pt-6 text-center">
            <p className="font-mono text-sm text-neutral-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Sign up →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

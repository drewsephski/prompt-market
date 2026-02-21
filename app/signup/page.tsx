"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

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

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/prompts`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
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
          <h1 className="mb-2 font-serif text-3xl text-white">Create Account</h1>
          <p className="mb-8 font-mono text-sm text-neutral-400">
            Join the Prompt Library community
          </p>

          {success ? (
            <div className="border border-emerald-500/30 bg-emerald-950/10 p-6">
              <p className="font-mono text-sm text-emerald-400">
                ✅ Check your email! We&apos;ve sent you a confirmation link.
              </p>
            </div>
          ) : (
            <>
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
                  <p className="font-mono text-xs text-neutral-500">
                    Must be at least 6 characters
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="confirmPassword"
                    className="block font-mono text-xs tracking-widest text-neutral-500"
                  >
                    CONFIRM PASSWORD
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full border border-neutral-800 bg-neutral-900/50 px-4 py-3 font-mono text-sm text-white placeholder-neutral-600 transition-colors focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="animate-pulse">CREATING ACCOUNT...</span>
                  ) : (
                    "CREATE ACCOUNT →"
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 border-t border-neutral-800 pt-6 text-center">
            <p className="font-mono text-sm text-neutral-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

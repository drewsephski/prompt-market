"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const getSiteUrl = () => {
      // In production, use the configured site URL
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (siteUrl) {
        return siteUrl;
      }
      
      // For Vercel deployments, use the Vercel URL
      const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
      if (vercelUrl) {
        return `https://${vercelUrl}`;
      }
      
      // Fallback to current origin (this will be localhost in development)
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      
      // Final fallback
      return 'http://localhost:3000';
    };
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/confirm?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  }

  if (success) {
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
            href="/login"
            className="mb-12 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
          >
            ← BACK TO SIGN IN
          </Link>

          <div className="border border-neutral-800 bg-neutral-900/30 p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h1 className="mb-2 font-serif text-3xl text-white">Check your email</h1>
            <p className="mb-8 font-mono text-sm text-neutral-400">
              We sent a password reset link to <span className="text-emerald-400">{email}</span>
            </p>

            <div className="space-y-4">
              <p className="font-mono text-xs text-neutral-500">
                Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
              </p>

              <button
                onClick={() => router.push("/login")}
                className="w-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
              >
                BACK TO SIGN IN
              </button>
            </div>
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

      <main className="relative mx-auto max-w-md px-6 py-24">
        {/* Back link */}
        <Link
          href="/login"
          className="mb-12 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
        >
          ← BACK TO SIGN IN
        </Link>

        <div className="border border-neutral-800 bg-neutral-900/30 p-8">
          <h1 className="mb-2 font-serif text-3xl text-white">Reset Password</h1>
          <p className="mb-8 font-mono text-sm text-neutral-400">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>

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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-pulse">SENDING...</span>
              ) : (
                "SEND RESET LINK →"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

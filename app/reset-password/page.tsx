"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have the required parameters
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError("Invalid or expired reset link. Please request a new password reset.");
      setIsTokenValid(false);
    } else {
      setIsTokenValid(true);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        throw new Error("Missing authentication tokens");
      }

      // Set the session using the tokens from the reset link
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Password updated successfully, redirect to login
      router.push("/login?message=Password reset successful. Please sign in with your new password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  }

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto flex max-w-md items-center justify-center px-6 py-24">
          <div className="font-mono text-sm text-neutral-500">Validating reset link...</div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
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
          <div className="border border-neutral-800 bg-neutral-900/30 p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            
            <h1 className="mb-2 font-serif text-3xl text-white">Invalid Reset Link</h1>
            <p className="mb-8 font-mono text-sm text-neutral-400">
              {error || "This password reset link is invalid or has expired."}
            </p>
            
            <div className="space-y-4">
              <Link
                href="/forgot-password"
                className="block w-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 text-center font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
              >
                REQUEST NEW RESET LINK
              </Link>
              
              <Link
                href="/login"
                className="block w-full border border-neutral-800 px-8 py-4 text-center font-mono text-sm text-neutral-400 transition-all hover:border-neutral-700 hover:text-neutral-200"
              >
                BACK TO SIGN IN
              </Link>
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
          <h1 className="mb-2 font-serif text-3xl text-white">Set New Password</h1>
          <p className="mb-8 font-mono text-sm text-neutral-400">
            Enter your new password below
          </p>

          {error && (
            <div className="mb-6 border border-red-500/30 bg-red-950/10 p-4">
              <p className="font-mono text-xs text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="password"
                className="block font-mono text-xs tracking-widest text-neutral-500"
              >
                NEW PASSWORD
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
                <span className="animate-pulse">RESETTING...</span>
              ) : (
                "RESET PASSWORD →"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

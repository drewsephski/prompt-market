"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthNavProps {
  showCreateButton?: boolean;
}

export default function AuthNav({ showCreateButton = true }: AuthNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    getUser();

    // Listen for auth changes
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  if (isLoading) {
    return (
      <div className="font-mono text-xs text-neutral-500">...</div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        {showCreateButton && (
          <Link
            href="/create"
            className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
          >
            <span>+</span>
            Create
          </Link>
        )}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-500">
            {user.email?.split('@')[0]}
          </span>
          <button
            onClick={handleLogout}
            className="font-mono text-xs text-neutral-400 transition-colors hover:text-neutral-200"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="font-mono text-xs text-neutral-400 transition-colors hover:text-emerald-400"
      >
        Sign In
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
      >
        Sign Up
      </Link>
    </div>
  );
}

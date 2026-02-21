import AuthNav from "@/app/components/AuthNav";
import SplineViewer from "@/app/components/SplineViewer";
import Link from "next/link";

export default function Home() {
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
      <div className="pointer-events-none fixed -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none fixed -left-32 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <main className="relative mx-auto max-w-5xl px-6 py-24">
        {/* Navigation */}
        <nav className="mb-24 flex items-center justify-between">
          <div className="font-mono text-sm tracking-widest text-neutral-500">
            &lt;PROMPT_LIBRARY /&gt;
          </div>
          <AuthNav />
        </nav>

        {/* Hero */}
        <div className="mb-20 space-y-8">
          <h1 className="font-serif text-6xl font-light leading-[1.1] tracking-tight text-white sm:text-7xl lg:text-8xl">
            Structured
            <br />
            <span className="italic text-emerald-400">intelligence</span>
          </h1>
          
          <p className="max-w-xl font-mono text-sm leading-relaxed text-neutral-400">
            A public collection of system prompts engineered for precision. 
            No ratings, no noise — just structured thinking, freely shared.
          </p>
        </div>

        {/* Prompt Structure Preview */}
        <div className="mb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { tag: "Role", desc: "Define the persona" },
            { tag: "Context", desc: "Set the stage" },
            { tag: "Instructions", desc: "Core directives" },
            { tag: "Constraints", desc: "Boundaries" },
            { tag: "Output_Format", desc: "Structure" },
            { tag: "User_Input", desc: "Variables" },
          ].map((item, i) => (
            <div
              key={item.tag}
              className="group border border-neutral-800 bg-neutral-900/50 p-6 transition-colors hover:border-neutral-700"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <code className="mb-2 block text-xs text-emerald-500">
                &lt;{item.tag}&gt;
              </code>
              <p className="text-sm text-neutral-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href="/prompts"
            className="inline-flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
          >
            Browse Prompts
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center justify-center border border-neutral-800 px-8 py-4 font-mono text-sm text-neutral-400 transition-all hover:border-neutral-700 hover:text-neutral-200"
          >
            Add Your Prompt
          </Link>
        </div>

        {/* Footer stats */}
        <div className="mt-32 flex gap-12 border-t border-neutral-800 pt-8">
          <div>
            <div className="font-serif text-3xl text-white">6</div>
            <div className="font-mono text-xs text-neutral-500">Sections</div>
          </div>
          <div>
            <div className="font-serif text-3xl text-white">∞</div>
            <div className="font-mono text-xs text-neutral-500">Possibilities</div>
          </div>
        </div>
      </main>

      {/* Spline 3D Viewer - Background blend */}
      <div className="relative w-full opacity-60">
        <SplineViewer />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface ComplexitySelectorProps {
  onGenerate: (idea: string, complexity: 'simple' | 'complex' | 'visionary') => void;
  isGenerating: boolean;
}

const COMPLEXITY_LEVELS = {
  simple: {
    label: "Simple Yet Comprehensive",
    description: "Clear, accessible, broadly applicable with thorough coverage",
    icon: "◉",
    color: "emerald",
    examples: [
      "Task organizer",
      "Writing assistant", 
      "Basic code reviewer"
    ]
  },
  complex: {
    label: "Complex But General",
    description: "Sophisticated, broadly applicable, with advanced concepts",
    icon: "◎",
    color: "violet",
    examples: [
      "Systems architect",
      "AI ethics consultant",
      "Strategic advisor"
    ]
  },
  visionary: {
    label: "Visionary & Niche",
    description: "Highly dynamic, forward-thinking, deeply conceptual",
    icon: "◈",
    color: "amber",
    examples: [
      "Ontological engineer",
      "Hyperreality analyst",
      "Consciousness designer"
    ]
  }
};

export default function ComplexitySelector({ onGenerate, isGenerating }: ComplexitySelectorProps) {
  const [selectedComplexity, setSelectedComplexity] = useState<'simple' | 'complex' | 'visionary'>('simple');
  const [idea, setIdea] = useState("");

  const handleGenerate = () => {
    if (idea.trim()) {
      onGenerate(idea.trim(), selectedComplexity);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="border border-neutral-800/60 bg-neutral-900/30 backdrop-blur-sm p-4 rounded-sm">
      <div className="mb-4">
        <h3 className="font-serif text-lg text-white mb-1">Generate Custom Prompt</h3>
        <p className="font-mono text-xs text-neutral-500">
          Choose complexity and describe your idea
        </p>
      </div>

      {/* Complexity Selector */}
      <div className="mb-4">
        <label className="block font-mono text-xs text-neutral-400 mb-2 tracking-widest">
          COMPLEXITY LEVEL
        </label>
        <div className="grid gap-2">
          {Object.entries(COMPLEXITY_LEVELS).map(([key, level]) => (
            <button
              key={key}
              onClick={() => setSelectedComplexity(key as 'simple' | 'complex' | 'visionary')}
              className={`
                relative p-3 border rounded-sm transition-all text-left
                ${selectedComplexity === key
                  ? `border-${level.color}-500/50 bg-${level.color}-500/10`
                  : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <span className={`text-sm ${selectedComplexity === key ? `text-${level.color}-400` : 'text-neutral-600'}`}>
                  {level.icon}
                </span>
                <div className="flex-1">
                  <h4 className={`font-mono text-xs font-medium ${selectedComplexity === key ? `text-${level.color}-400` : 'text-neutral-300'}`}>
                    {level.label}
                  </h4>
                  <p className="font-mono text-[10px] text-neutral-500 leading-tight mt-0.5">
                    {level.description}
                  </p>
                </div>
              </div>
              {selectedComplexity === key && (
                <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-${level.color}-400 animate-pulse`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Idea Input */}
      <div className="mb-3">
        <label className="block font-mono text-xs text-neutral-400 mb-2 tracking-widest">
          YOUR IDEA
        </label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your prompt idea..."
          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-sm p-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none transition-all"
          rows={2}
          disabled={isGenerating}
        />
        <div className="mt-1 text-right">
          <span className="font-mono text-[9px] text-neutral-600">
            ⌘ + Enter to generate
          </span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!idea.trim() || isGenerating}
        className="w-full relative px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all group overflow-hidden"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isGenerating ? (
            <>
              <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>GENERATING...</span>
            </>
          ) : (
            <>
              <span className="transition-transform group-hover:scale-110">⚡</span>
              <span>GENERATE {COMPLEXITY_LEVELS[selectedComplexity].label.toUpperCase()}</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}

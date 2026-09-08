"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Loader2, Zap } from "lucide-react";

interface AgentPromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const QUICK_SUGGESTIONS = [
  "Cari tahu kenapa sales di bulan Agustus 2026 turun drastis",
  "Break down kontribusi revenue di wilayah Jawa Timur",
  "Analisis produk apa yang paling tinggi penurunan omzetnya",
];

export default function AgentPromptInput({ onSubmit, isLoading }: AgentPromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt);
    setPrompt("");
  };

  const handleSelectSuggestion = (text: string) => {
    if (isLoading) return;
    setPrompt(text);
    onSubmit(text);
  };

  return (
    <div className="space-y-2.5">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-black text-black uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-[#FF5388] stroke-[3]" />
          Suggested:
        </span>
        {QUICK_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSelectSuggestion(s)}
            className="px-3 py-1 rounded-xl bg-white border-2 border-black text-black hover:bg-yellow-200 text-xs font-bold transition-all shrink-0 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chunky Neobrutalist Command Box */}
      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl border-3 border-black bg-white p-4 shadow-brutal-lg"
      >
        <textarea
          ref={textareaRef}
          rows={2}
          value={prompt}
          disabled={isLoading}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Berikan goal terbuka (misal: 'Cari tahu kenapa revenue bulan Agustus 2026 turun dibanding Juli')..."
          className="w-full resize-none bg-transparent font-sans text-sm font-bold text-black placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between pt-3 border-t-2 border-black mt-2">
          {/* Smart Context Chips */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full border-2 border-black bg-[#FFD12E] text-xs font-black text-black shadow-brutal-sm cursor-pointer hover:bg-yellow-300">
              ⚡ Metric: Revenue
            </span>
            <span className="px-3 py-1 rounded-full border-2 border-black bg-[#3B82F6] text-xs font-black text-white shadow-brutal-sm cursor-pointer">
              📅 MoM Comparison
            </span>
            <kbd className="hidden sm:inline-flex text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5 rounded border border-black shadow-brutal-sm">
              Ctrl+K
            </kbd>
          </div>

          {/* Tactile Button Press Effect */}
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl border-2 border-black bg-[#FFD12E] hover:bg-yellow-400 disabled:bg-slate-200 text-black font-display font-black text-xs uppercase tracking-wider shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>INVESTIGATING...</span>
              </>
            ) : (
              <>
                <span>INVESTIGATE</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

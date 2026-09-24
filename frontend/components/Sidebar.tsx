"use client";

import React from "react";
import {
  PlusCircle,
  Clock,
  Pin,
  Layers,
  Shield,
  Brain,
  TrendingDown,
  Sparkles,
  Zap,
} from "lucide-react";
import { Conversation } from "../lib/types";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewInvestigation: () => void;
  onOpenSemantic: () => void;
  onOpenRbac: () => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewInvestigation,
  onOpenSemantic,
  onOpenRbac,
}: SidebarProps) {
  return (
    <aside className="w-[260px] bg-[#FAF6F0] text-black flex flex-col justify-between border-r-3 border-black p-3.5 select-none h-full overflow-y-auto">
      <div className="space-y-4">
        {/* + New Goal Button (Vibrant Yellow Neobrutal) */}
        <button
          onClick={onNewInvestigation}
          className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#FFD12E] hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider border-3 border-black shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
        >
          <PlusCircle className="w-4 h-4 stroke-[3]" />
          <span>+ NEW INVESTIGATION</span>
        </button>

        {/* Recent Analysis Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-black uppercase tracking-wider text-black">
            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>RECENT ANALYSIS</span>
          </div>

          <div className="space-y-1.5">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                const isProactive =
                  conv.goal_or_question?.includes("[PROACTIVE ALERT]") ||
                  conv.user_id === "proactive_agent_watcher";

                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 border-2 border-black ${
                      isActive
                        ? "bg-[#FF5388] text-white font-extrabold shadow-brutal-sm"
                        : "bg-white text-black hover:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] font-semibold"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isProactive ? (
                          <Zap className={`w-3.5 h-3.5 shrink-0 stroke-[2.5] ${isActive ? "fill-white text-white" : "fill-[#FFD12E] text-black"}`} />
                        ) : (
                          <TrendingDown className={`w-3.5 h-3.5 shrink-0 stroke-[2.5] ${isActive ? "text-white" : "text-black"}`} />
                        )}
                        <span className="truncate text-2xs font-mono opacity-80 font-bold">
                          {conv.id.substring(0, 8)}
                        </span>
                      </div>
                      {isProactive && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                            isActive
                              ? "bg-black text-[#FFD12E] border-black"
                              : "bg-[#FFD12E] text-black border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          }`}
                        >
                          ⚡ PROACTIVE
                        </span>
                      )}
                    </div>
                    <span className="line-clamp-2 leading-snug">
                      {conv.goal_or_question}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs font-bold text-slate-500 border-2 border-dashed border-black/40 rounded-xl bg-white/60">
                No previous sessions.
              </div>
            )}
          </div>
        </div>

        {/* Pinned Baselines Section */}
        <div className="space-y-2 pt-2 border-t-2 border-black">
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-black uppercase tracking-wider text-black">
            <Pin className="w-3.5 h-3.5 text-[#FF5388] stroke-[2.5]" />
            <span>PINNED BASELINES</span>
          </div>

          <div className="space-y-1.5">
            <div className="px-3 py-2 rounded-xl bg-white text-xs border-2 border-black shadow-brutal-sm flex items-center justify-between font-bold">
              <span className="font-mono text-[11px]">July 2026 Baseline</span>
              <span className="font-black px-1.5 py-0.5 rounded bg-[#2DD4BF] border border-black">$769.9k</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white text-xs border-2 border-black shadow-brutal-sm flex items-center justify-between font-bold">
              <span className="font-mono text-[11px]">East Java Share</span>
              <span className="font-black px-1.5 py-0.5 rounded bg-[#FFD12E] border border-black">40.6%</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Governance Bottom Nav */}
      <div className="pt-3 border-t-2 border-black space-y-1.5">
        <div className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
          GOVERNANCE & AUDIT
        </div>
        <button
          onClick={onOpenSemantic}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-yellow-100 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-[#3B82F6] stroke-[2.5]" />
          <span>Semantic Model</span>
        </button>

        <button
          onClick={onOpenRbac}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-teal-100 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Shield className="w-3.5 h-3.5 text-[#2DD4BF] stroke-[2.5]" />
          <span>RBAC & Security</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 text-2xs font-extrabold text-black bg-[#FAF6F0]">
          <Brain className="w-3.5 h-3.5 text-[#FF5388] stroke-[2.5]" />
          <span>Agent Memory: 3 Rules</span>
        </div>
      </div>
    </aside>
  );
}

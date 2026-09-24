"use client";

import React, { useState } from "react";
import {
  X,
  Terminal,
  Brain,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { Conversation, AgentMemory } from "../lib/types";

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  memories: AgentMemory[];
}

export default function AuditDrawer({
  isOpen,
  onClose,
  conversation,
  memories,
}: AuditDrawerProps) {
  const [activeTab, setActiveTab] = useState<"sql" | "memory" | "export">("sql");
  const [copiedSql, setCopiedSql] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySql = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(id);
    setTimeout(() => setCopiedSql(null), 2000);
  };

  const handleExportJson = () => {
    if (!conversation) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversation, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `datara-audit-${conversation.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const sqlToolCalls =
    conversation?.steps.flatMap((s) =>
      s.tool_calls.map((tc) => ({
        ...tc,
        stepTitle: s.title,
        stepOrder: s.step_order,
      }))
    ) || [];

  return (
    <aside className="w-[340px] bg-[#FAF6F0] text-black border-l-3 border-black flex flex-col h-full z-10 select-none shadow-2xl">
      {/* Header */}
      <div className="h-[58px] px-4 border-b-3 border-black flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-black stroke-[3]" />
          <h3 className="font-display text-xs font-black uppercase tracking-wider text-black">
            AUDIT & SQL INSPECTOR
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-black hover:bg-slate-200 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b-3 border-black text-xs font-black bg-white">
        <button
          onClick={() => setActiveTab("sql")}
          className={`flex-1 py-2.5 text-center transition-all flex items-center justify-center gap-1.5 border-r-2 border-black ${
            activeTab === "sql"
              ? "bg-[#FFD12E] text-black"
              : "bg-white text-slate-600 hover:bg-yellow-50"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>SQL</span>
          <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-md font-mono">
            {sqlToolCalls.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("memory")}
          className={`flex-1 py-2.5 text-center transition-all flex items-center justify-center gap-1.5 border-r-2 border-black ${
            activeTab === "memory"
              ? "bg-[#3B82F6] text-white"
              : "bg-white text-slate-600 hover:bg-blue-50"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>MEMORY</span>
        </button>

        <button
          onClick={() => setActiveTab("export")}
          className={`flex-1 py-2.5 text-center transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "export"
              ? "bg-[#2DD4BF] text-black"
              : "bg-white text-slate-600 hover:bg-teal-50"
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "sql" && (
          <div className="space-y-3.5">
            {sqlToolCalls.length > 0 ? (
              sqlToolCalls.map((tc, idx) => (
                <div
                  key={tc.id || idx}
                  className="rounded-xl border-3 border-black bg-black p-4 text-xs font-mono text-white shadow-brutal space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b-2 border-slate-700 pb-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full border border-black bg-[#2DD4BF]" />
                      <span className="text-[#2DD4BF] font-black uppercase tracking-wide">AST Verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      {tc.latency_ms && <span className="px-1.5 py-0.2 rounded bg-slate-800 text-2xs font-bold">{tc.latency_ms}ms</span>}
                      <button
                        onClick={() => handleCopySql(tc.executed_sql || "", tc.id || `${idx}`)}
                        className="text-white hover:text-[#FFD12E]"
                        title="Copy SQL"
                      >
                        {copiedSql === (tc.id || `${idx}`) ? (
                          <Check className="w-3.5 h-3.5 text-[#2DD4BF] stroke-[3]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#FF5388] font-sans font-black uppercase tracking-wider">
                    STEP {tc.stepOrder}: {tc.stepTitle}
                  </div>

                  <pre className="overflow-x-auto text-[#FFD12E] text-[11px] leading-relaxed font-bold bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <code>{tc.executed_sql || "-- Direct analytical calculation"}</code>
                  </pre>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs font-bold text-slate-500 border-2 border-dashed border-black/40 rounded-xl bg-white p-4">
                No SQL queries recorded yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "memory" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#3B82F6] text-white border-2 border-black shadow-brutal-sm text-xs font-bold">
              Active company instructions governing this session:
            </div>

            {memories.map((mem) => {
              const isLearned = mem.category === "learned_heuristic";
              return (
                <div
                  key={mem.id}
                  className={`p-3.5 rounded-xl border-2 border-black shadow-brutal-sm text-xs space-y-1.5 ${
                    isLearned ? "bg-amber-50 border-3 border-black" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`uppercase font-black px-1.5 py-0.2 rounded border border-black ${
                        isLearned
                          ? "bg-[#2DD4BF] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-[#FFD12E] text-black"
                      }`}
                    >
                      {isLearned ? "⚡ LEARNED HEURISTIC" : mem.category}
                    </span>
                    <span className="font-bold text-slate-500">by {mem.added_by}</span>
                  </div>
                  <p className={`text-black ${isLearned ? "font-mono font-bold text-2xs" : "font-sans font-bold"}`}>
                    {mem.instruction_text}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white border-3 border-black shadow-brutal text-xs space-y-2.5">
              <h4 className="font-black text-sm uppercase text-black">Export Dossier</h4>
              <p className="text-slate-600 text-2xs font-bold leading-relaxed">
                Export complete audit log, executed SQL queries, and explainable insight cards in JSON for enterprise governance compliance.
              </p>
              <button
                onClick={handleExportJson}
                disabled={!conversation}
                className="w-full mt-2 py-2.5 px-3 rounded-xl bg-[#FFD12E] hover:bg-yellow-300 disabled:bg-slate-200 text-black text-xs font-black uppercase tracking-wider border-2 border-black shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4 stroke-[3]" />
                <span>DOWNLOAD JSON AUDIT</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t-3 border-black bg-white text-[10px] text-black font-black uppercase tracking-wider flex items-center justify-between font-mono">
        <span>Read-Only Sandbox</span>
        <span className="px-1.5 py-0.5 rounded bg-[#2DD4BF] border border-black text-black">AST Enforced</span>
      </div>
    </aside>
  );
}

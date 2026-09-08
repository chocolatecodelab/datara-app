"use client";

import React from "react";
import { Check, Loader2, Circle, AlertCircle, Terminal } from "lucide-react";
import { AnalysisStep } from "../lib/types";

interface PlanVisualizerProps {
  steps: AnalysisStep[];
  goal: string;
}

export default function PlanVisualizer({ steps, goal }: PlanVisualizerProps) {
  if (!steps || steps.length === 0) return null;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="rounded-2xl border-3 border-black bg-white p-5 shadow-brutal-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-3 border-black pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-[#FFD12E] text-black font-black text-sm shadow-brutal-sm">
            ⚡
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-black uppercase tracking-wider text-black">
                Autonomous Investigation Plan
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[#2DD4BF] text-black font-mono text-[10px] font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {completedCount}/{steps.length} STEPS
              </span>
            </div>
            <p className="text-2xs font-bold text-slate-500 line-clamp-1">{goal}</p>
          </div>
        </div>

        {/* Progress Bar Chunky Box */}
        <div className="flex items-center gap-2">
          <div className="w-28 h-3.5 bg-slate-100 rounded-md border-2 border-black overflow-hidden p-0.5">
            <div
              className="h-full bg-[#FFD12E] rounded-xs transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-black text-black bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-black">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map((step) => {
          const isDone = step.status === "completed";
          const isInProgress = step.status === "in_progress";
          const isPending = step.status === "pending";
          const hasSql = step.tool_calls && step.tool_calls.some((tc) => !!tc.executed_sql);

          return (
            <div
              key={step.id || step.step_order}
              className={`flex items-center justify-between p-3 rounded-xl border-2 border-black font-mono transition-all ${
                isInProgress
                  ? "bg-[#FFD12E] shadow-brutal font-bold text-black"
                  : isDone
                  ? "bg-white shadow-brutal-sm text-black"
                  : "bg-slate-100 opacity-60 border-dashed text-slate-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black font-extrabold text-xs shrink-0 ${
                    isDone
                      ? "bg-[#2DD4BF] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      : isInProgress
                      ? "bg-black text-white animate-pulse"
                      : "bg-white text-black"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isInProgress ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    step.step_order
                  )}
                </span>

                <div>
                  <span className="font-sans text-sm font-bold text-black">
                    {step.step_order}. {step.title}
                  </span>
                  {step.result_summary && isDone && (
                    <p className="text-2xs text-slate-600 font-mono font-semibold mt-0.5">
                      {step.result_summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {step.duration_ms && (
                  <span className="px-2 py-0.5 rounded-md border border-black bg-white text-2xs font-mono font-bold text-black">
                    {step.duration_ms}ms
                  </span>
                )}
                {hasSql && (
                  <span className="px-2 py-0.5 rounded-md border-2 border-black bg-[#3B82F6] text-white text-2xs font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                    <Terminal className="w-2.5 h-2.5" />
                    SQL
                  </span>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

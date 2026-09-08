"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { Insight } from "../lib/types";

interface InsightCardProps {
  insight: Insight;
  onOpenAudit?: () => void;
}

export default function InsightCard({ insight, onOpenAudit }: InsightCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(insight.finding);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHighConfidence = insight.confidence >= 0.8;
  const isDrop =
    insight.finding.toLowerCase().includes("turun") ||
    insight.finding.toLowerCase().includes("penurunan") ||
    insight.finding.toLowerCase().includes("drop");

  return (
    <div className="rounded-2xl border-3 border-black bg-white p-6 shadow-brutal-lg space-y-5">
      {/* 1. Header & Confidence Badge */}
      <div className="flex items-center justify-between border-b-3 border-black pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-[#FF5388] text-white font-black text-xl shadow-brutal-sm">
            {isDrop ? <TrendingDown className="w-6 h-6 stroke-[3]" /> : <TrendingUp className="w-6 h-6 stroke-[3]" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono uppercase tracking-widest font-black text-slate-500">
                EXECUTIVE REPORT
              </span>
              <span className="px-2 py-0.2 rounded-md text-[10px] font-black bg-[#FFD12E] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                Variance Model
              </span>
            </div>
            <h3 className="font-display text-lg font-black text-black">
              Variance & Root Cause Finding
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Chunky Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#2DD4BF] px-4 py-1.5 text-xs font-black text-black shadow-brutal-sm animate-brutal-float">
            <span className="h-2.5 w-2.5 rounded-full bg-black animate-ping" />
            <span>CONFIDENCE {Math.round(insight.confidence * 100)}%</span>
          </div>

          <button
            onClick={handleCopy}
            className="p-2 rounded-xl text-black hover:bg-yellow-200 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            title="Copy Finding"
          >
            {copied ? <Check className="w-4 h-4 text-black stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
          </button>
        </div>
      </div>

      {/* 2. Main Finding Statement Box */}
      <div className="p-4 rounded-xl border-2 border-black bg-[#FAF6F0] shadow-brutal-sm">
        <p className="font-sans text-base font-bold text-black leading-relaxed">
          {insight.finding}
        </p>
      </div>

      {/* 3. Root Cause Variance Contribution Waterfall */}
      {insight.main_drivers && insight.main_drivers.length > 0 && (
        <div className="space-y-3 rounded-xl border-2 border-black bg-white p-4 shadow-brutal-sm">
          <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
            <h4 className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#FF5388] stroke-[2.5]" />
              <span>ROOT CAUSE VARIANCE CONTRIBUTION</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              Impact % Relative to Total Delta
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {insight.main_drivers.map((driver, idx) => {
              const absPct = Math.min(Math.abs(driver.impact_pct), 100);
              const isNegative = driver.impact_pct < 0;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between font-mono text-xs font-black text-black">
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-black text-[#FFD12E] text-[10px]">
                        #{idx + 1}
                      </span>
                      <span>{driver.value}</span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        ({driver.dimension})
                      </span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md border border-black font-black text-white ${
                        isNegative ? "bg-[#FF4757]" : "bg-[#2DD4BF] text-black"
                      }`}
                    >
                      {driver.impact_pct > 0 ? `+${driver.impact_pct}%` : `${driver.impact_pct}%`}
                    </span>
                  </div>

                  {/* Chunky Progress Bar */}
                  <div className="h-3.5 w-full overflow-hidden rounded-md border-2 border-black bg-slate-100 p-0.5">
                    <div
                      className={`h-full rounded-xs transition-all duration-700 ease-out ${
                        isNegative ? "bg-[#FF4757]" : "bg-[#2DD4BF]"
                      }`}
                      style={{ width: `${absPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Evidence & Formula Footnote */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t-2 border-black font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-black text-black uppercase">EVIDENCE:</span>
          <span className="px-2.5 py-1 rounded-lg border-2 border-black bg-[#FAF6F0] font-bold text-black shadow-brutal-sm">
            {insight.evidence_rows ? `${insight.evidence_rows.toLocaleString()} Records` : insight.evidence}{" "}
            <span className="text-slate-500 font-normal">({insight.data_source})</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-black text-black uppercase">FORMULA:</span>
          <code className="px-2.5 py-1 rounded-lg border-2 border-black bg-[#FFD12E] font-extrabold text-black shadow-brutal-sm">
            {insight.calculation}
          </code>
        </div>
      </div>
    </div>
  );
}

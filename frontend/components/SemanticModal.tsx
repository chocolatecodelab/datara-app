"use client";

import React from "react";
import { X, Layers, ShieldAlert } from "lucide-react";
import { SemanticMetric } from "../lib/types";

interface SemanticModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: SemanticMetric[];
}

export default function SemanticModal({ isOpen, onClose, metrics }: SemanticModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-4 border-black shadow-brutal-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-[#FFD12E]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display text-base font-black uppercase tracking-wide text-black">
                Enterprise Semantic Layer
              </h3>
              <p className="text-2xs font-extrabold text-black/80">
                Single Source of Truth for Business Metrics & Dimensions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white text-black hover:bg-slate-100 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-[#FAF6F0]">
          <p className="text-xs font-bold text-slate-700 leading-relaxed bg-white p-3 rounded-xl border-2 border-black shadow-brutal-sm">
            💡 Datara secara ketat merujuk definisi metrik di bawah ini sebelum menyusun query SQL. LLM dilarang membaca skema mentah secara bebas tanpa resolusi Semantic Layer.
          </p>

          <div className="space-y-3.5">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="rounded-2xl border-3 border-black p-4 bg-white shadow-brutal-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-black">{metric.name}</span>
                    <span className="text-2xs bg-[#FF5388] text-white font-mono font-black px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      {metric.source_table}
                    </span>
                  </div>
                  <span className="text-2xs text-black font-extrabold bg-[#FAF6F0] px-2 py-0.5 rounded border border-black">
                    Owner: {metric.owner}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Formula
                    </span>
                    <code className="bg-[#FAF6F0] px-2.5 py-1 rounded-lg border-2 border-black text-black font-mono text-xs font-bold block truncate shadow-2xs">
                      {metric.formula}
                    </code>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Allowed Dimensions
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {metric.allowed_dimensions.map((dim, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#2DD4BF] text-black font-black text-2xs font-mono border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {dim}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {metric.business_terms && metric.business_terms.length > 0 && (
                  <div className="text-xs">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Synonyms & Business Terms
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {metric.business_terms.map((term, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-yellow-100 text-black text-2xs font-bold border border-black"
                        >
                          "{term}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {metric.business_rules && (
                  <div className="text-2xs font-bold text-black bg-[#FAF6F0] p-2.5 rounded-xl border-2 border-black flex items-start gap-1.5 shadow-2xs">
                    <ShieldAlert className="w-4 h-4 text-[#FF5388] shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>Rule: {metric.business_rules}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t-3 border-black bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black text-[#FFD12E] border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

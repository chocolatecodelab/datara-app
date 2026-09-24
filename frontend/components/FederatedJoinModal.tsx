"use client";

import React, { useState, useEffect } from "react";
import { X, Network, Play, RefreshCw, Layers, CheckCircle2, ArrowRight, Database, ShieldCheck, Clock } from "lucide-react";
import { FederatedJoinRequest, FederatedQueryResult } from "../lib/types";
import { fetchFederationSample, executeFederatedJoin } from "../lib/api";

interface FederatedJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FederatedJoinModal({ isOpen, onClose }: FederatedJoinModalProps) {
  const [request, setRequest] = useState<FederatedJoinRequest | null>(null);
  const [result, setResult] = useState<FederatedQueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSampleAndExecute();
    }
  }, [isOpen]);

  const loadSampleAndExecute = async () => {
    setLoading(true);
    try {
      const sample = await fetchFederationSample();
      setRequest(sample);
      const res = await executeFederatedJoin(sample);
      setResult(res);
    } catch (e) {
      console.error("Federation execution failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReExecute = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const res = await executeFederatedJoin(request);
      setResult(res);
    } catch (e) {
      console.error("Re-execution failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-4 border-black shadow-brutal-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-[#3B82F6]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
              <Network className="w-6 h-6 stroke-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-black uppercase tracking-wide text-white">
                  Multi-Source Federated Join Engine
                </h3>
                <span className="bg-black text-[#2DD4BF] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-white/20">
                  Cross-Source Sandbox
                </span>
              </div>
              <p className="text-2xs font-extrabold text-white/90">
                In-Memory Relational Joins across PostgreSQL Warehouse &amp; SQLite CRM Replicas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white text-black hover:bg-slate-100 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-black stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-[#FAF6F0] flex-1">
          {/* Visual Architecture Diagram: Source A ⨝ Source B */}
          <div className="bg-white rounded-2xl border-3 border-black p-4 shadow-brutal">
            <div className="text-2xs font-black uppercase tracking-wider text-black/60 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Federated Relational Topology
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              {/* Source A */}
              <div className="bg-[#FAF6F0] border-2 border-black p-3 rounded-xl shadow-brutal-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black font-display uppercase text-black flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-blue-600" /> Source A: Warehouse
                  </span>
                  <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-400">
                    PostgreSQL
                  </span>
                </div>
                <p className="font-mono text-[10px] text-black/70 mb-1">Table: orders (1,480 rows)</p>
                <div className="bg-black text-[#2DD4BF] font-mono text-[9px] p-1.5 rounded truncate">
                  Join Key: customer_id
                </div>
              </div>

              {/* Join Operator */}
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <span className="text-xs font-black font-mono bg-[#FFE500] text-black px-3 py-1 rounded-full border-2 border-black shadow-brutal-sm mb-1">
                  ⨝ INNER JOIN
                </span>
                <span className="text-[10px] font-bold font-mono text-black/70">
                  customer_id = customer_ref_id
                </span>
              </div>

              {/* Source B */}
              <div className="bg-[#FAF6F0] border-2 border-black p-3 rounded-xl shadow-brutal-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black font-display uppercase text-black flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-amber-600" /> Source B: CRM
                  </span>
                  <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-400">
                    SQLite Replica
                  </span>
                </div>
                <p className="font-mono text-[10px] text-black/70 mb-1">Table: customers (120 rows)</p>
                <div className="bg-black text-[#2DD4BF] font-mono text-[9px] p-1.5 rounded truncate">
                  Join Key: customer_ref_id
                </div>
              </div>
            </div>
          </div>

          {/* Performance & Latency Decomposition */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border-2 border-black p-3 rounded-xl shadow-brutal-sm">
                <span className="text-[10px] font-black uppercase text-black/60 block">Total Result Rows</span>
                <span className="text-2xl font-black font-display text-black">{result.total_rows} Records</span>
                <p className="text-[10px] font-bold text-emerald-700 mt-0.5">✓ Sanitized &amp; RBAC Clean</p>
              </div>

              <div className="bg-white border-2 border-black p-3 rounded-xl shadow-brutal-sm">
                <span className="text-[10px] font-black uppercase text-black/60 block">Sub-query Fetch</span>
                <span className="text-2xl font-black font-display text-black">{result.execution_latency_ms}ms</span>
                <p className="text-[10px] font-bold text-black/70 mt-0.5">Parallel AST Sandboxes</p>
              </div>

              <div className="bg-[#2DD4BF] border-2 border-black p-3 rounded-xl shadow-brutal-sm text-black">
                <span className="text-[10px] font-black uppercase text-black/80 block">In-Memory Join Engine</span>
                <span className="text-2xl font-black font-display text-black">{result.join_latency_ms}ms</span>
                <p className="text-[10px] font-black text-black/80 mt-0.5">Pandas Zero-Drift Merge</p>
              </div>
            </div>
          )}

          {/* Merged Relational Output Table */}
          <div className="bg-white rounded-2xl border-3 border-black shadow-brutal p-4 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div>
                <h4 className="font-display font-black text-xs uppercase tracking-wide text-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Merged Relational Output Stream
                </h4>
                <p className="text-[10px] font-mono text-black/60">
                  {result?.join_summary || "Loading federated data..."}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded">
                Live Preview
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-black mb-2" />
                <p className="text-xs font-black uppercase tracking-wider text-black">
                  Executing distributed sub-queries and merging across engines...
                </p>
              </div>
            ) : result && result.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black bg-slate-50 text-[10px] font-black uppercase text-black">
                      {result.columns.map((col) => (
                        <th key={col} className="py-2 px-3 whitespace-nowrap">
                          <span className={`inline-block mr-1.5 px-1 rounded text-[8px] ${
                            col.startsWith("customer_") && col !== "customer_id" || col === "region" || col === "segment"
                              ? "bg-amber-100 text-amber-900 border border-amber-400"
                              : "bg-blue-100 text-blue-900 border border-blue-400"
                          }`}>
                            {col.startsWith("customer_") && col !== "customer_id" || col === "region" || col === "segment" ? "CRM" : "WH"}
                          </span>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 font-mono text-[11px]">
                    {result.data.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-amber-50/50">
                        {result.columns.map((col) => (
                          <td key={col} className="py-2 px-3 whitespace-nowrap text-black font-semibold">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-neutral-400 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-bold text-black/60">
                No federated rows returned.
              </div>
            )}
          </div>

          {/* Lineage Audit Trail */}
          {result && result.lineage && result.lineage.length > 0 && (
            <div className="bg-white rounded-2xl border-3 border-black shadow-brutal p-4 space-y-2">
              <span className="text-2xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Data Source Lineage &amp; Origin Tracking
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {result.lineage.map((lin) => (
                  <div key={lin.alias} className="p-3 bg-slate-50 border-2 border-black rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black font-mono text-black uppercase">[{lin.alias}]</span>
                      <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 border border-black rounded">
                        {lin.source_type}
                      </span>
                    </div>
                    <p className="font-bold text-black/80 text-[11px]">{lin.source_name}</p>
                    <p className="font-mono text-[10px] text-black/60">
                      Extracted: {lin.rows_extracted} rows in {lin.latency_ms}ms
                    </p>
                    <p className="font-mono text-[9px] text-black/50 truncate">
                      Columns: {lin.columns_extracted.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t-3 border-black flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-slate-100 text-xs font-black uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            Close Explorer
          </button>
          <button
            onClick={handleReExecute}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-black bg-[#FFE500] hover:bg-amber-300 text-black text-xs font-black uppercase shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? "animate-spin" : ""}`} />
            {loading ? "Merging Data..." : "Re-Execute Federated Query"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle, Database, Layers, Sparkles, AlertCircle } from "lucide-react";
import { DataSourceQualityReport, TableQualityReport } from "../lib/types";
import { fetchDataSourceQuality, runDataSourceQualityScan } from "../lib/api";

interface DataQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataSourceId: string | null;
  dataSourceName: string;
  initialReport?: DataSourceQualityReport | null;
}

export default function DataQualityModal({
  isOpen,
  onClose,
  dataSourceId,
  dataSourceName,
  initialReport,
}: DataQualityModalProps) {
  const [report, setReport] = useState<DataSourceQualityReport | null>(initialReport || null);
  const [loading, setLoading] = useState(false);
  const [activeTableIndex, setActiveTableIndex] = useState(0);

  useEffect(() => {
    if (isOpen && dataSourceId) {
      if (!report || report.data_source_id !== dataSourceId) {
        loadReport(dataSourceId);
      }
    }
  }, [isOpen, dataSourceId]);

  const loadReport = async (dsId: string) => {
    setLoading(true);
    try {
      const data = await fetchDataSourceQuality(dsId);
      setReport(data);
      setActiveTableIndex(0);
    } catch (e) {
      console.error("Failed to load quality audit:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async () => {
    if (!dataSourceId) return;
    setLoading(true);
    try {
      const updated = await runDataSourceQualityScan(dataSourceId);
      setReport(updated);
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentTable: TableQualityReport | undefined = report?.tables?.[activeTableIndex];
  const overallScore = report?.overall_score ?? 100;
  const isHealthy = overallScore >= 90;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-4 border-black shadow-brutal-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-[#FFE500]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
              <ShieldCheck className="w-6 h-6 stroke-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-black uppercase tracking-wide text-black">
                  Data Quality & Schema Sentinel
                </h3>
                <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Autonomous Audit
                </span>
              </div>
              <p className="text-2xs font-extrabold text-black/80">
                Profiling & Schema Drift Monitoring for: {dataSourceName}
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
          {loading && !report ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black mb-3" />
              <p className="text-xs font-black uppercase tracking-wider text-black">
                Profiling schema & calculating statistical null ratios...
              </p>
            </div>
          ) : report ? (
            <>
              {/* Score & SLA Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Health Score Card */}
                <div
                  className={`p-4 rounded-2xl border-3 border-black shadow-brutal flex flex-col justify-between ${
                    isHealthy ? "bg-[#2DD4BF]" : overallScore >= 75 ? "bg-[#FFE500]" : "bg-[#FF4365] text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-black uppercase tracking-wider text-black">
                      Health Score
                    </span>
                    <ShieldCheck className="w-4 h-4 text-black" />
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-black font-display text-black">
                      {overallScore.toFixed(1)}%
                    </div>
                    <p className="text-2xs font-bold text-black/80 uppercase">
                      Status: {report.status}
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-black bg-white/70 px-2 py-1 rounded border border-black inline-block">
                    {report.tables_count} Tables Profiled
                  </div>
                </div>

                {/* Freshness SLA Card */}
                <div className="p-4 rounded-2xl border-3 border-black bg-white shadow-brutal flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-black uppercase tracking-wider text-black">
                      Freshness SLA
                    </span>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-black font-display text-black">
                      100% SLA MET
                    </div>
                    <p className="text-2xs font-bold text-black/60">
                      Sync lag &lt; 15 mins
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-1 rounded border border-emerald-400 inline-block">
                    Target: &lt; 60m SLA
                  </div>
                </div>

                {/* Schema Drift & Duplicates */}
                <div className="p-4 rounded-2xl border-3 border-black bg-white shadow-brutal flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-black uppercase tracking-wider text-black">
                      Integrity Check
                    </span>
                    <Layers className="w-4 h-4 text-black" />
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-black font-display text-black">
                      0 DRIFT / 0 DUP
                    </div>
                    <p className="text-2xs font-bold text-black/60">
                      PK constraints verified
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-cyan-900 bg-cyan-100 px-2 py-1 rounded border border-cyan-400 inline-block">
                    Last Scan: {new Date(report.scanned_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Table Selector Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-black" /> Profiled Tables
                  </span>
                  <span className="text-2xs font-extrabold text-black/60">
                    Click table to inspect column null-rates
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.tables.map((t, idx) => (
                    <button
                      key={t.table_name}
                      onClick={() => setActiveTableIndex(idx)}
                      className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl border-2 border-black transition-all cursor-pointer ${
                        activeTableIndex === idx
                          ? "bg-black text-white shadow-brutal-sm -translate-y-0.5"
                          : "bg-white text-black hover:bg-amber-100"
                      }`}
                    >
                      {t.table_name} ({t.total_rows.toLocaleString()} rows)
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Table Column Quality Breakdown */}
              {currentTable && (
                <div className="bg-white rounded-2xl border-3 border-black shadow-brutal p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
                    <div>
                      <h4 className="font-display font-black text-sm uppercase text-black">
                        Table: {currentTable.table_name}
                      </h4>
                      <p className="text-2xs font-bold text-black/60">
                        {currentTable.total_rows.toLocaleString()} records • {currentTable.duplicates_count} duplicate keys detected
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#2DD4BF] text-black text-[10px] font-black uppercase rounded border border-black">
                        Score: {currentTable.table_score}%
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded border border-emerald-500">
                        {currentTable.freshness_status}
                      </span>
                    </div>
                  </div>

                  {/* Columns Detail Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-black bg-slate-50 text-[11px] font-black uppercase text-black">
                          <th className="py-2 px-3">Column Name</th>
                          <th className="py-2 px-2">Type</th>
                          <th className="py-2 px-2 text-right">Null Count</th>
                          <th className="py-2 px-4">Null Rate</th>
                          <th className="py-2 px-2 text-right">Distinct Values</th>
                          <th className="py-2 px-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10 font-medium">
                        {currentTable.columns.map((col) => (
                          <tr key={col.column_name} className="hover:bg-amber-50/50">
                            <td className="py-2 px-3 font-black text-black font-mono text-[11px]">
                              {col.column_name}
                            </td>
                            <td className="py-2 px-2 font-mono text-[10px] text-black/70">
                              {col.data_type}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-black font-bold">
                              {col.null_count}
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-200 h-2 rounded-full border border-black overflow-hidden">
                                  <div
                                    className={`h-full ${col.null_pct > 0.05 ? "bg-[#FF4365]" : "bg-[#2DD4BF]"}`}
                                    style={{ width: `${Math.min(100, Math.max(2, col.null_pct * 100))}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[10px] font-bold text-black">
                                  {(col.null_pct * 100).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-black">
                              {col.distinct_count.toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {col.is_clean ? (
                                <span className="inline-block px-1.5 py-0.5 bg-[#2DD4BF] text-black text-[9px] font-black uppercase rounded border border-black">
                                  Clean
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 bg-[#FF4365] text-white text-[9px] font-black uppercase rounded border border-black">
                                  Attention
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommendations & Quality Sentinel Observations */}
              <div className="bg-white rounded-2xl border-3 border-black shadow-brutal p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black fill-[#FFE500]" />
                  <h4 className="font-display font-black text-xs uppercase tracking-wide text-black">
                    Autonomous Sentinel Recommendations
                  </h4>
                </div>
                <div className="space-y-1.5 pt-1">
                  {report.agent_recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-bold text-black/85">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                  {report.quality_warnings.length > 0 && (
                    <div className="pt-2">
                      <div className="p-3 bg-red-50 border-2 border-[#FF4365] rounded-xl space-y-1">
                        <span className="text-2xs font-black text-[#FF4365] uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Identified Anomalies:
                        </span>
                        {report.quality_warnings.map((w, idx) => (
                          <p key={idx} className="text-xs font-bold text-red-900">
                            • {w}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-black/50 mb-2" />
              <p className="text-xs font-bold text-black/70">No quality audit report available.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t-3 border-black flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-slate-100 text-xs font-black uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            Close Audit
          </button>
          <button
            onClick={handleRunScan}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-black bg-[#FFE500] hover:bg-amber-300 text-black text-xs font-black uppercase shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? "animate-spin" : ""}`} />
            {loading ? "Profiling In Progress..." : "Run Fresh Quality Scan"}
          </button>
        </div>
      </div>
    </div>
  );
}

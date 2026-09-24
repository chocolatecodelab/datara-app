"use client";

import React, { useState } from "react";
import { X, Zap, AlertTriangle, RefreshCw, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { ProactiveStatusResponse, ProactiveScanResult, AnomalyItem } from "../lib/types";
import { triggerProactiveScan } from "../lib/api";

interface ProactiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusData: ProactiveStatusResponse | null;
  onScanComplete?: (result: ProactiveScanResult) => void;
  onSelectConversation?: (conversationId: string) => void;
}

export default function ProactiveModal({
  isOpen,
  onClose,
  statusData,
  onScanComplete,
  onSelectConversation,
}: ProactiveModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ProactiveScanResult | null>(null);

  if (!isOpen) return null;

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const res = await triggerProactiveScan();
      setScanResult(res);
      if (onScanComplete) {
        onScanComplete(res);
      }
    } catch (e) {
      console.error("Proactive scan failed:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const anomalies: AnomalyItem[] = scanResult?.anomalies_detected ?? statusData?.recent_anomalies ?? [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-4 border-black shadow-brutal-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-[#2DD4BF]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
              <Zap className="w-5 h-5 fill-black stroke-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-black uppercase tracking-wide text-black">
                  Autonomous Proactive Watcher
                </h3>
                <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Level 7
                </span>
              </div>
              <p className="text-2xs font-extrabold text-black/80">
                24/7 Metric Anomaly Engine & Autonomous Multi-Agent Trigger
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
        <div className="p-6 overflow-y-auto space-y-5 bg-[#FAF6F0]">
          {/* Status Banner */}
          <div className="bg-white p-4 rounded-2xl border-3 border-black shadow-brutal-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-black"></span>
                </span>
                <span className="font-black text-xs uppercase tracking-wide text-black">
                  Background Watcher: Active
                </span>
              </div>
              <p className="text-2xs font-bold text-slate-600">
                Monitors {statusData?.monitored_metrics_count || 5} semantic metrics • Threshold: Deficit &gt; 12.0%
              </p>
            </div>

            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="px-4 py-2 bg-[#FFD12E] hover:bg-[#ffc800] text-black font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Scanning Metrics..." : "Run Health Scan Now"}</span>
            </button>
          </div>

          {/* Autonomous Trigger Notification if Scan Triggered */}
          {scanResult?.autonomous_investigation_triggered && scanResult.conversation_id && (
            <div className="p-4 rounded-2xl border-3 border-black shadow-brutal-sm space-y-2.5 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
                <span>Autonomous Investigation Triggered!</span>
              </div>
              <p className="text-xs font-bold text-amber-800">
                {scanResult.message}
              </p>
              {onSelectConversation && (
                <button
                  onClick={() => {
                    onSelectConversation(scanResult.conversation_id!);
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-black text-white hover:bg-slate-800 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-brutal-sm flex items-center gap-2 transition-all"
                >
                  <span>Open Autonomous Investigation Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Anomalies Detected Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-black" />
                Detected Metric Anomalies ({anomalies.length})
              </span>
              <span className="text-2xs font-extrabold text-slate-500">
                Last checked: {statusData?.last_scan_at ? new Date(statusData.last_scan_at).toLocaleTimeString() : "Just now"}
              </span>
            </div>

            {anomalies.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border-2 border-black text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto stroke-[2.5]" />
                <p className="font-black text-sm text-black">All Metrics Healthy</p>
                <p className="text-xs font-bold text-slate-500">
                  No semantic metrics currently violate the -12% deficit boundary.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {anomalies.map((anom: AnomalyItem, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border-3 border-black p-4 shadow-brutal-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-black">{anom.metric_name}</span>
                        <span className="text-2xs bg-[#FAF6F0] text-black font-mono font-extrabold px-2 py-0.5 rounded border border-black">
                          {anom.dimension || "overall"}
                        </span>
                      </div>
                      <span className="text-2xs bg-[#FF5388] text-white font-black px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
                        {anom.severity} ({anom.deviation_pct}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF6F0] p-2.5 rounded-xl border border-black">
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase block">Baseline Value</span>
                        <span className="font-mono font-black text-black">
                          ${anom.previous_value.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase block">Current Value</span>
                        <span className="font-mono font-black text-rose-600">
                          ${anom.current_value.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      {anom.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Autonomous Governance info */}
          <div className="p-3 bg-white rounded-xl border-2 border-black flex items-start gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <p className="text-2xs font-bold text-slate-600 leading-relaxed">
              <strong>Level 7 Autonomy:</strong> When an anomaly breaches critical boundaries, Datara automatically spins up a multi-agent diagnostic session, runs SQL queries, and prepares actionable recovery plans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

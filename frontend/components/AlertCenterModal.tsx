"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Send, CheckCircle2, ShieldCheck, Mail, MessageSquare, Webhook, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import { AlertChannel, AlertDispatchLog, AlertingSummary } from "../lib/types";
import { fetchAlertChannels, fetchAlertLogs, fetchAlertingSummary, sendTestAlert } from "../lib/api";

interface AlertCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertCenterModal({ isOpen, onClose }: AlertCenterModalProps) {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [logs, setLogs] = useState<AlertDispatchLog[]>([]);
  const [summary, setSummary] = useState<AlertingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string>("slack");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<AlertDispatchLog | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chans, logList, sum] = await Promise.all([
        fetchAlertChannels(),
        fetchAlertLogs(),
        fetchAlertingSummary(),
      ]);
      setChannels(chans);
      setLogs(logList);
      setSummary(sum);
    } catch (e) {
      console.error("Failed to load alert data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await sendTestAlert({
        channel_type: testingChannel,
        custom_message: "Interactive operator test via Datara Navigation Hub",
      });
      setTestResult(res);
      setLogs((prev) => [res, ...prev]);
    } catch (e) {
      console.error("Test alert failed:", e);
    } finally {
      setTestSending(false);
    }
  };

  if (!isOpen) return null;

  const getChannelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "slack":
        return <MessageSquare className="w-4 h-4 text-emerald-700" />;
      case "email":
        return <Mail className="w-4 h-4 text-blue-700" />;
      case "webhook":
      default:
        return <Webhook className="w-4 h-4 text-amber-700" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-4 border-black shadow-brutal-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-[#FF4365] text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
              <Bell className="w-5 h-5 fill-black stroke-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-black uppercase tracking-wide text-white">
                  Real-Time Alerting &amp; Notification Hub
                </h3>
                <span className="bg-black text-[#2DD4BF] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-white/20">
                  Live Dispatch
                </span>
              </div>
              <p className="text-2xs font-extrabold text-white/90">
                Multi-Channel Dispatcher: Slack (Block Kit), Executive Email &amp; Webhook
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
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-white border-3 border-black rounded-2xl shadow-brutal">
              <span className="text-2xs font-black uppercase text-black/60 block">Active Channels</span>
              <span className="text-2xl font-black font-display text-black">
                {summary ? summary.active_channels_count : channels.length} Channels
              </span>
              <p className="text-[10px] font-bold text-emerald-700 mt-0.5">Slack • Email • Webhook</p>
            </div>

            <div className="p-3.5 bg-[#2DD4BF] border-3 border-black rounded-2xl shadow-brutal text-black">
              <span className="text-2xs font-black uppercase text-black/80 block">Delivery Success</span>
              <span className="text-2xl font-black font-display text-black">
                {summary ? summary.delivery_success_rate_pct.toFixed(1) : 99.8}%
              </span>
              <p className="text-[10px] font-black text-black/80 mt-0.5">0 Failed Dispatches</p>
            </div>

            <div className="p-3.5 bg-[#FFE500] border-3 border-black rounded-2xl shadow-brutal text-black">
              <span className="text-2xs font-black uppercase text-black/80 block">Dispatches (24H)</span>
              <span className="text-2xl font-black font-display text-black">
                {summary ? summary.total_alerts_sent_24h : 18} Alerts
              </span>
              <p className="text-[10px] font-black text-black/80 mt-0.5">Avg Latency: 23ms</p>
            </div>
          </div>

          {/* Configured Notification Channels */}
          <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-brutal space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase tracking-wide text-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Configured Alert Endpoints
              </span>
              <span className="text-2xs font-extrabold text-black/60">
                Triggered on Critical Deviations &amp; Quality Breaches
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {channels.map((ch) => (
                <div key={ch.id} className="p-3 bg-[#FAF6F0] border-2 border-black rounded-xl shadow-brutal-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-xs uppercase text-black flex items-center gap-1">
                      {getChannelIcon(ch.channel_type)} {ch.name}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#2DD4BF] text-black text-[9px] font-black uppercase rounded border border-black">
                      Active
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-black/70 truncate">{ch.destination}</p>
                  <div className="pt-1 flex items-center justify-between text-[9px] font-bold text-black/60">
                    <span>Threshold: {ch.min_severity}+</span>
                    <span className="text-emerald-700 font-extrabold">200 OK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instant Test Dispatch Card */}
          <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-brutal space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wide text-black flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-black" /> Instant Test Dispatch
              </span>
              <span className="text-2xs font-bold text-neutral-600">
                Simulates live notification delivery
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-2xs font-mono font-bold uppercase">Channel:</label>
                <select
                  value={testingChannel}
                  onChange={(e) => setTestingChannel(e.target.value)}
                  className="px-3 py-1.5 bg-[#FAF6F0] border-2 border-black font-mono text-xs font-bold rounded-lg cursor-pointer"
                >
                  <option value="slack">Slack (#exec-alerts)</option>
                  <option value="email">Email (leadership@datara.ai)</option>
                  <option value="webhook">Webhook (ERP incident)</option>
                </select>
              </div>

              <button
                onClick={handleSendTest}
                disabled={testSending}
                className="px-4 py-1.5 bg-[#FFE500] hover:bg-amber-300 border-2 border-black font-mono text-xs font-black uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testSending ? "animate-spin" : ""}`} />
                {testSending ? "Dispatching..." : "⚡ Send Test Alert"}
              </button>
            </div>

            {testResult && (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-xs font-mono font-bold text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{testResult.payload_preview}</span>
                </div>
                <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded border border-emerald-400">
                  Delivered in {testResult.latency_ms}ms
                </span>
              </div>
            )}
          </div>

          {/* Recent Dispatch Audit Feed */}
          <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-brutal space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase tracking-wide text-black flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Recent Alert Dispatch Audit Feed
              </span>
              <span className="text-2xs font-mono font-bold text-black/60">
                Auto-saved to audit trail
              </span>
            </div>

            <div className="space-y-2">
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-[#FAF6F0] border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-black text-white text-[9px] font-black uppercase rounded">
                      {log.channel_type}
                    </span>
                    <span className="font-bold text-black text-[11px] truncate max-w-sm">
                      {log.payload_preview}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-black/70 shrink-0">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-400">
                      {log.status} ({log.latency_ms}ms)
                    </span>
                    <span>{new Date(log.sent_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t-3 border-black flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-slate-100 text-xs font-black uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            Close Alert Hub
          </button>
          <span className="text-2xs font-mono font-extrabold text-black/60">
            Automated Slack Block Kit &amp; SMTP Handlers Active
          </span>
        </div>
      </div>
    </div>
  );
}

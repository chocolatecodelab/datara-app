"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  Layers,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
  Zap,
  Bell,
} from "lucide-react";
import AlertCenterModal from "./AlertCenterModal";

interface TopNavProps {
  onOpenSemantic?: () => void;
  onOpenRbac?: () => void;
  onOpenProactive?: () => void;
  proactiveAnomalyCount?: number;
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
  activeTab?: "workstation" | "datasources";
}

export function TopNav({
  onOpenSemantic,
  onOpenRbac,
  onOpenProactive,
  proactiveAnomalyCount = 0,
  isInspectorOpen = false,
  onToggleInspector,
  activeTab,
}: TopNavProps) {
  const pathname = usePathname();
  const currentTab = activeTab || (pathname?.includes("/datasources") ? "datasources" : "workstation");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  return (
    <header className="col-span-full h-[58px] bg-[#FAF6F0] border-b-3 border-black px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Navigation Links */}
      <div className="flex items-center gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 bg-[#FFD12E] border-2 border-black flex items-center justify-center text-black font-black text-base shadow-brutal-sm group-hover:rotate-6 transition-transform">
            D
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-black font-display uppercase">
              Datara
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#FF5388] text-white border-2 border-black uppercase tracking-wider shadow-brutal-sm">
              Agentic v1.0
            </span>
          </div>
        </Link>

        <div className="h-5 w-0.5 bg-black" />

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 font-mono text-xs font-bold">
          <Link
            href="/"
            className={`px-3 py-1.5 border-2 border-black shadow-brutal-sm transition-all ${
              currentTab === "workstation"
                ? "bg-black text-white translate-x-0.5 translate-y-0.5 shadow-none"
                : "bg-white hover:bg-[#FFD12E] text-black"
            }`}
          >
            ⚡ WORKSTATION
          </Link>
          <Link
            href="/datasources"
            className={`px-3 py-1.5 border-2 border-black shadow-brutal-sm transition-all flex items-center gap-1.5 ${
              currentTab === "datasources"
                ? "bg-black text-white translate-x-0.5 translate-y-0.5 shadow-none"
                : "bg-white hover:bg-[#FFD12E] text-black"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            DATA SOURCES
          </Link>
        </nav>
      </div>

      {/* Semantic Health & System Status Badges */}
      <div className="flex items-center gap-2.5">
        {onOpenProactive && (
          <button
            onClick={onOpenProactive}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-black bg-white hover:bg-[#FFD12E] border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            title="Open Autonomous Proactive Metric Watcher (Level 7)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black"></span>
            </span>
            <Zap className="w-3.5 h-3.5 fill-black text-black" />
            <span>PROACTIVE WATCHER</span>
            {proactiveAnomalyCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#FF5388] text-white font-mono text-[10px] border border-black font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {proactiveAnomalyCount} ALERT{proactiveAnomalyCount > 1 ? "S" : ""}
              </span>
            )}
          </button>
        )}

        {/* Real-Time Alerts Hub Button */}
        <button
          onClick={() => setIsAlertModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-black bg-white hover:bg-[#FF4365] hover:text-white border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          title="Open Real-Time Alerting & Notification Hub"
        >
          <Bell className="w-3.5 h-3.5 fill-black text-black" />
          <span>ALERTS</span>
          <span className="px-1.5 py-0.2 bg-[#FF4365] text-white font-mono text-[10px] border border-black font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            SLACK • EMAIL
          </span>
        </button>

        {onOpenSemantic && (
          <button
            onClick={onOpenSemantic}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-black bg-[#2DD4BF] hover:bg-[#26bfae] border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            title="Open Semantic Layer Governance"
          >
            <Layers className="w-3.5 h-3.5 text-black" />
            <span>SEMANTIC LAYER</span>
            <span className="px-1.5 py-0.2 bg-white text-black font-mono text-[10px] border border-black font-black">
              3 ACTIVE
            </span>
          </button>
        )}

        {onOpenRbac && (
          <button
            onClick={onOpenRbac}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-black bg-[#FFD12E] hover:bg-yellow-300 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            title="Open RBAC & Field Security Governance"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>RBAC: ANALYST</span>
          </button>
        )}

        {onToggleInspector && (
          <>
            <div className="h-5 w-0.5 bg-black" />
            <button
              onClick={onToggleInspector}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold border-2 border-black transition-all ${
                isInspectorOpen
                  ? "bg-[#3B82F6] text-white shadow-brutal-sm"
                  : "bg-white text-black hover:bg-slate-100 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              }`}
              title="Toggle SQL & Audit Inspector (Ctrl+I)"
            >
              {isInspectorOpen ? (
                <PanelRightClose className="w-4 h-4 text-white" />
              ) : (
                <PanelRightOpen className="w-4 h-4 text-black" />
              )}
              <span>AUDIT INSPECTOR</span>
              <kbd className="text-[10px] font-mono bg-black text-white px-1.5 py-0.5 border border-black">
                Ctrl+I
              </kbd>
            </button>
          </>
        )}

        {/* Profile Avatar */}
        <div className="flex items-center pl-1">
          <div className="h-8 w-8 bg-black text-[#FFD12E] font-black text-xs flex items-center justify-center border-2 border-black shadow-brutal-sm font-mono">
            NL
          </div>
        </div>
      </div>

      {/* Real-Time Alerting Hub Modal */}
      <AlertCenterModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </header>
  );
}

export default TopNav;

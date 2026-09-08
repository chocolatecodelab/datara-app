"use client";

import React, { useState, useEffect } from "react";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import PlanVisualizer from "../components/PlanVisualizer";
import InsightCard from "../components/InsightCard";
import RecommendationCard from "../components/RecommendationCard";
import AgentPromptInput from "../components/AgentPromptInput";
import AuditDrawer from "../components/AuditDrawer";
import SemanticModal from "../components/SemanticModal";
import RBACModal from "../components/RBACModal";
import {
  fetchMetrics,
  fetchMemories,
  fetchRoles,
  fetchConversations,
  createConversation,
  MOCK_METRICS,
  MOCK_MEMORIES,
  MOCK_ROLES,
} from "../lib/api";
import { Conversation, SemanticMetric, AgentMemory, Role } from "../lib/types";
import { Sparkles, TrendingDown, Layers, ShieldCheck, Zap } from "lucide-react";

export default function WorkstationPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [metrics, setMetrics] = useState<SemanticMetric[]>(MOCK_METRICS);
  const [memories, setMemories] = useState<AgentMemory[]>(MOCK_MEMORIES);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);

  const [isLoading, setIsLoading] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isSemanticOpen, setIsSemanticOpen] = useState(false);
  const [isRbacOpen, setIsRbacOpen] = useState(false);

  // Initial Data Load
  useEffect(() => {
    async function loadData() {
      const [loadedMetrics, loadedMemories, loadedRoles, loadedConvs] = await Promise.all([
        fetchMetrics(),
        fetchMemories(),
        fetchRoles(),
        fetchConversations(),
      ]);

      if (loadedMetrics && loadedMetrics.length > 0) setMetrics(loadedMetrics);
      if (loadedMemories && loadedMemories.length > 0) setMemories(loadedMemories);
      if (loadedRoles && loadedRoles.length > 0) setRoles(loadedRoles);

      if (loadedConvs && loadedConvs.length > 0) {
        setConversations(loadedConvs);
        setActiveConversation(loadedConvs[0]);
      }
    }
    loadData();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSemanticOpen(false);
        setIsRbacOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Goal / Investigation Trigger
  const handleStartInvestigation = async (goal: string) => {
    setIsLoading(true);

    try {
      const newConv = await createConversation(goal, true);
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
      setActiveConversation(newConv);
    } catch (err) {
      console.error("Failed to run investigation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    const found = conversations.find((c) => c.id === id);
    if (found) setActiveConversation(found);
  };

  const handleNewInvestigation = () => {
    setActiveConversation(null);
  };

  return (
    <div className="datara-shell-grid bg-[#FAF6F0] text-black overflow-hidden font-sans">
      {/* 1. Top Navigation Bar (58px) */}
      <TopNav
        onOpenSemantic={() => setIsSemanticOpen(true)}
        onOpenRbac={() => setIsRbacOpen(true)}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
      />

      {/* 2. Left Sidebar (260px) */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        onNewInvestigation={handleNewInvestigation}
        onOpenSemantic={() => setIsSemanticOpen(true)}
        onOpenRbac={() => setIsRbacOpen(true)}
      />

      {/* 3. Central Agentic Workspace (Flex 1) */}
      <main className="flex-1 flex flex-col justify-between overflow-y-auto bg-[#FAF6F0] p-6">
        <div className="max-w-4xl w-full mx-auto space-y-6 pb-4">
          {activeConversation ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Investigation Header */}
              <div className="flex items-center justify-between border-b-3 border-black pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-[#FFD12E] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                      ACTIVE INVESTIGATION
                    </span>
                    <span className="text-2xs text-black font-mono font-bold">
                      {new Date(activeConversation.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h1 className="font-display text-xl font-black text-black mt-1 uppercase">
                    {activeConversation.goal_or_question}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-[#2DD4BF] text-black border-2 border-black shadow-brutal-sm">
                    <span className="h-2 w-2 rounded-full bg-black animate-ping" />
                    STATUS: COMPLETED
                  </span>
                </div>
              </div>

              {/* Autonomous Plan Stepper */}
              {activeConversation.steps && activeConversation.steps.length > 0 && (
                <PlanVisualizer
                  steps={activeConversation.steps}
                  goal={activeConversation.goal_or_question}
                />
              )}

              {/* 5-Pillar Explainable Insight Cards */}
              {activeConversation.insights && activeConversation.insights.length > 0 ? (
                activeConversation.insights.map((ins) => (
                  <InsightCard
                    key={ins.id}
                    insight={ins}
                    onOpenAudit={() => setIsInspectorOpen(true)}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-xs font-bold text-black bg-white rounded-2xl border-3 border-black shadow-brutal">
                  Synthesizing insights...
                </div>
              )}

              {/* Level 6: Prescriptive Action Plans & Recommendations */}
              {activeConversation.recommendations && activeConversation.recommendations.length > 0 && (
                <div className="space-y-4 pt-4 border-t-3 border-black">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-sm uppercase tracking-wider text-black">
                        PRESCRIPTIVE BUSINESS RECOMMENDATIONS
                      </span>
                      <span className="bg-[#2DD4BF] text-black font-mono font-bold text-xs px-2 py-0.5 border border-black shadow-brutal-sm">
                        LEVEL 6
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-600">
                      {activeConversation.recommendations.length} Action Plans Generated
                    </span>
                  </div>

                  <div className="space-y-4">
                    {activeConversation.recommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        onStatusChange={(recId, newStatus) => {
                          setActiveConversation((prev) => {
                            if (!prev || !prev.recommendations) return prev;
                            return {
                              ...prev,
                              recommendations: prev.recommendations.map((r) =>
                                r.id === recId ? { ...r, status: newStatus as any } : r
                              ),
                            };
                          });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Welcome Hero Neobrutalist Box */
            <div className="max-w-2xl mx-auto text-center py-10 space-y-6">
              <div className="h-20 w-20 rounded-3xl bg-[#FFD12E] border-3 border-black text-black flex items-center justify-center mx-auto shadow-brutal animate-brutal-float">
                <Sparkles className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-3xl font-black text-black tracking-tight uppercase">
                  Datara Agentic Workstation
                </h1>
                <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-md mx-auto">
                  Workstation Analisis Data Otonom. Berikan business goal terbuka untuk memulai investigasi, dekomposisi varians, dan isolasi akar masalah dengan bukti nyata.
                </p>
              </div>

              {/* Feature Highlights (Chunky Neobrutal Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-left pt-2">
                <div className="p-4 rounded-2xl bg-white border-3 border-black shadow-brutal space-y-1.5 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                  <div className="flex items-center gap-2 text-xs font-black text-black uppercase">
                    <span className="px-1.5 py-0.2 rounded bg-[#FFD12E] border border-black">01</span>
                    <span>Autonomous Plan</span>
                  </div>
                  <p className="text-2xs font-bold text-slate-600 leading-snug">
                    Menyusun analytical plan bertahap otomatis dari goal bisnis.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border-3 border-black shadow-brutal space-y-1.5 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                  <div className="flex items-center gap-2 text-xs font-black text-black uppercase">
                    <span className="px-1.5 py-0.2 rounded bg-[#FF5388] text-white border border-black">02</span>
                    <span>Root Cause Drill</span>
                  </div>
                  <p className="text-2xs font-bold text-slate-600 leading-snug">
                    Dekomposisi varians persentase dampak multidimensi (region, SKU).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border-3 border-black shadow-brutal space-y-1.5 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                  <div className="flex items-center gap-2 text-xs font-black text-black uppercase">
                    <span className="px-1.5 py-0.2 rounded bg-[#2DD4BF] border border-black">03</span>
                    <span>Explainable & AST</span>
                  </div>
                  <p className="text-2xs font-bold text-slate-600 leading-snug">
                    Evidence, formula, confidence score, dan SQL sandbox read-only.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Command Bar at Bottom */}
        <div className="max-w-4xl w-full mx-auto pt-2">
          <AgentPromptInput
            onSubmit={handleStartInvestigation}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* 4. Right Inspector Drawer (340px) */}
      <AuditDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        conversation={activeConversation}
        memories={memories}
      />

      {/* Modals */}
      <SemanticModal
        isOpen={isSemanticOpen}
        onClose={() => setIsSemanticOpen(false)}
        metrics={metrics}
      />
      <RBACModal
        isOpen={isRbacOpen}
        onClose={() => setIsRbacOpen(false)}
        roles={roles}
      />
    </div>
  );
}

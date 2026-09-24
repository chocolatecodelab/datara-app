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
import WhatIfSimulator from "../components/WhatIfSimulator";
import ProactiveModal from "../components/ProactiveModal";
import {
  fetchMetrics,
  fetchMemories,
  fetchRoles,
  fetchConversations,
  fetchConversationById,
  createConversation,
  subscribeToConversationEvents,
  fetchProactiveStatus,
  MOCK_METRICS,
  MOCK_MEMORIES,
  MOCK_ROLES,
} from "../lib/api";
import {
  Conversation,
  SemanticMetric,
  AgentMemory,
  Role,
  ProactiveStatusResponse,
  ProactiveScanResult,
} from "../lib/types";
import { Sparkles, TrendingDown, Layers, ShieldCheck, Zap, Loader2 } from "lucide-react";

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
  const [isProactiveOpen, setIsProactiveOpen] = useState(false);
  const [proactiveStatus, setProactiveStatus] = useState<ProactiveStatusResponse | null>(null);

  // Initial Data Load
  useEffect(() => {
    async function loadData() {
      const [loadedMetrics, loadedMemories, loadedRoles, loadedConvs, loadedProactive] = await Promise.all([
        fetchMetrics(),
        fetchMemories(),
        fetchRoles(),
        fetchConversations(),
        fetchProactiveStatus(),
      ]);

      if (loadedMetrics && loadedMetrics.length > 0) setMetrics(loadedMetrics);
      if (loadedMemories && loadedMemories.length > 0) setMemories(loadedMemories);
      if (loadedRoles && loadedRoles.length > 0) setRoles(loadedRoles);
      if (loadedProactive) setProactiveStatus(loadedProactive);

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
        setIsProactiveOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Goal / Investigation Trigger with Live SSE Streaming
  const handleStartInvestigation = async (goal: string) => {
    setIsLoading(true);

    try {
      // 1. Create conversation in asynchronous mode (sync=false)
      const initialConv = await createConversation(goal, false);
      const activeObj: Conversation = {
        ...initialConv,
        status: "analyzing",
        steps: initialConv.steps || [],
        insights: initialConv.insights || [],
        recommendations: initialConv.recommendations || [],
      };

      setActiveConversation(activeObj);
      setConversations((prev) => [activeObj, ...prev.filter((c) => c.id !== activeObj.id)]);

      // 2. Subscribe to live event stream
      subscribeToConversationEvents(
        initialConv.id,
        {
          onIntent: (intentData) => {
            console.log("Stream: Intent detected", intentData);
          },
          onPlanReady: ({ steps }) => {
            setActiveConversation((prev) => {
              if (!prev || prev.id !== initialConv.id) return prev;
              const updated = {
                ...prev,
                status: "analyzing" as const,
                steps: steps.map((s) => ({
                  ...s,
                  status: s.status || "pending",
                })),
              };
              setConversations((list) => list.map((c) => (c.id === updated.id ? updated : c)));
              return updated;
            });
          },
          onStepStart: ({ step_order }) => {
            setActiveConversation((prev) => {
              if (!prev || prev.id !== initialConv.id) return prev;
              const updatedSteps = (prev.steps || []).map((s) =>
                s.step_order === step_order ? { ...s, status: "in_progress" as const } : s
              );
              const updated = { ...prev, steps: updatedSteps };
              setConversations((list) => list.map((c) => (c.id === updated.id ? updated : c)));
              return updated;
            });
          },
          onStepComplete: ({ step_order, duration_ms, result_summary, executed_sql, tool_name, latency_ms }) => {
            setActiveConversation((prev) => {
              if (!prev || prev.id !== initialConv.id) return prev;
              const updatedSteps = (prev.steps || []).map((s) => {
                if (s.step_order === step_order) {
                  const existingCalls = s.tool_calls || [];
                  const newToolCalls = executed_sql
                    ? [
                        ...existingCalls,
                        {
                          id: `tc-${Date.now()}-${step_order}`,
                          analysis_step_id: s.id,
                          tool_name: tool_name || "execute_query",
                          arguments: {},
                          result: {},
                          executed_sql: executed_sql,
                          latency_ms: latency_ms || 45,
                          status: "completed",
                          created_at: new Date().toISOString(),
                        },
                      ]
                    : existingCalls;

                  return {
                    ...s,
                    status: "completed" as const,
                    duration_ms,
                    result_summary,
                    tool_calls: newToolCalls,
                  };
                }
                return s;
              });
              const updated = { ...prev, steps: updatedSteps };
              setConversations((list) => list.map((c) => (c.id === updated.id ? updated : c)));
              return updated;
            });
          },
          onInsightReady: ({ insight }) => {
            setActiveConversation((prev) => {
              if (!prev || prev.id !== initialConv.id) return prev;
              const updated = {
                ...prev,
                insights: [insight],
              };
              setConversations((list) => list.map((c) => (c.id === updated.id ? updated : c)));
              return updated;
            });
          },
          onRecommendationsReady: ({ recommendations }) => {
            setActiveConversation((prev) => {
              if (!prev || prev.id !== initialConv.id) return prev;
              const updated = {
                ...prev,
                recommendations,
              };
              setConversations((list) => list.map((c) => (c.id === updated.id ? updated : c)));
              return updated;
            });
          },
          onComplete: () => {
            setActiveConversation((prev) => {
              if (!prev || prev.id !== initialConv.id) return prev;
              const updated = {
                ...prev,
                status: "completed" as const,
              };
              setConversations((list) => list.map((c) => (c.id === updated.id ? updated : c)));
              return updated;
            });
            setIsLoading(false);
          },
          onError: (err) => {
            console.error("Stream error, completed with fallback:", err);
            setIsLoading(false);
          },
        },
        initialConv
      );
    } catch (err) {
      console.error("Failed to run investigation:", err);
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

  const handleProactiveScanComplete = async (result: ProactiveScanResult) => {
    try {
      const updatedStatus = await fetchProactiveStatus();
      if (updatedStatus) setProactiveStatus(updatedStatus);

      if (result.autonomous_investigation_triggered && result.conversation_id) {
        const loadedConv = await fetchConversationById(result.conversation_id);
        if (loadedConv) {
          setConversations((prev) => [loadedConv, ...prev.filter((c) => c.id !== loadedConv.id)]);
          setActiveConversation(loadedConv);
        } else {
          // Fallback autonomous conversation in offline or mock mode
          const firstAnomaly = result.anomalies_detected[0];
          const autonomousConv: Conversation = {
            id: result.conversation_id,
            organization_id: "org-1",
            user_id: "proactive_agent_watcher",
            goal_or_question: `[PROACTIVE ALERT] Investigasi Anomali Defisit ${firstAnomaly?.metric_name || "Revenue"} (${firstAnomaly?.deviation_pct || "-20.7"}%)`,
            status: "completed",
            created_at: new Date().toISOString(),
            steps: [
              {
                id: `step-auto-1`,
                conversation_id: result.conversation_id,
                step_order: 1,
                title: "Autonomous Metric Anomaly Detection",
                description: "Proactive watcher scanned semantic metrics and identified -20.7% revenue breach.",
                status: "completed",
                duration_ms: 22,
                result_summary: "Anomaly confirmed in East Java region.",
                created_at: new Date().toISOString(),
                tool_calls: [],
              },
              {
                id: `step-auto-2`,
                conversation_id: result.conversation_id,
                step_order: 2,
                title: "AST SQL Decomposition & Segment Isolation",
                description: "Queried transaction database grouped by region and SKU.",
                status: "completed",
                duration_ms: 45,
                result_summary: "East Java Product Alpha isolated as primary variance driver.",
                created_at: new Date().toISOString(),
                tool_calls: [],
              },
            ],
            insights: [
              {
                id: `ins-auto-1`,
                conversation_id: result.conversation_id,
                finding: `[PROACTIVE INCIDENT] Terdeteksi anomali kritis pada metrik ${firstAnomaly?.metric_name || "Revenue"} di wilayah East Java dengan deviasi ${firstAnomaly?.deviation_pct || "-20.7"}% melampaui batas toleransi -12.0%.`,
                evidence: "Dianalisis secara otonom oleh Level 7 Proactive Watcher dari 1,480 transaksi pesanan.",
                evidence_rows: 1480,
                calculation: "Deviation = (Current - Baseline) / Baseline * 100",
                confidence: 0.94,
                main_drivers: [
                  {
                    dimension: "region",
                    value: "East Java",
                    impact_pct: -54.2,
                    previous_val: 312400,
                    current_val: 247800,
                  },
                  {
                    dimension: "product",
                    value: "Product Alpha (Flagship)",
                    impact_pct: -48.1,
                    previous_val: 260000,
                    current_val: 202650,
                  },
                ],
                data_source: "Acme E-Commerce DB (Proactive Watcher)",
                created_at: new Date().toISOString(),
              },
            ],
            recommendations: [
              {
                id: `rec-auto-1`,
                conversation_id: result.conversation_id,
                title: "Emergency Regional Stock Reallocation to Surabaya Hub",
                rationale: "East Java stockout has caused $64,600 revenue deficit. Immediate stock redistribution will recover up to 65% of regional run-rate.",
                target_dimension: "region:East Java",
                estimated_impact_amount: 42500,
                estimated_impact_pct: 17.1,
                priority: "P0 (URGENT)",
                difficulty: "Medium",
                confidence: 0.92,
                status: "pending_approval",
                action_steps: [
                  {
                    id: 1,
                    step: "Dispatch 500 units of Product Alpha from Central Warehouse to Surabaya Hub",
                    pic_role: "VP of Supply Chain",
                    completed: false,
                  },
                  {
                    id: 2,
                    step: "Contact Tier-1 East Java distributors with stock priority commitment",
                    pic_role: "Regional Sales Director (East)",
                    completed: false,
                  },
                ],
                created_at: new Date().toISOString(),
              },
            ],
          };
          setConversations((prev) => [autonomousConv, ...prev.filter((c) => c.id !== autonomousConv.id)]);
          setActiveConversation(autonomousConv);
        }
      }
    } catch (e) {
      console.error("Failed to handle proactive scan result:", e);
    }
  };

  const isCurrentActiveAnalyzing =
    activeConversation?.status === "analyzing" ||
    activeConversation?.status === "planning" ||
    isLoading;

  return (
    <div className="datara-shell-grid bg-[#FAF6F0] text-black overflow-hidden font-sans">
      {/* 1. Top Navigation Bar (58px) */}
      <TopNav
        onOpenSemantic={() => setIsSemanticOpen(true)}
        onOpenRbac={() => setIsRbacOpen(true)}
        onOpenProactive={() => setIsProactiveOpen(true)}
        proactiveAnomalyCount={proactiveStatus?.recent_anomalies_count || 0}
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
                  {isCurrentActiveAnalyzing ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-[#FFD12E] text-black border-2 border-black shadow-brutal-sm">
                      <span className="h-2 w-2 rounded-full bg-black animate-ping" />
                      STATUS: ANALYZING (LIVE)
                    </span>
                  ) : activeConversation.status === "failed" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-[#FF4757] text-white border-2 border-black shadow-brutal-sm">
                      STATUS: FAILED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-[#2DD4BF] text-black border-2 border-black shadow-brutal-sm">
                      <span className="h-2 w-2 rounded-full bg-black" />
                      STATUS: COMPLETED
                    </span>
                  )}
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
              ) : isCurrentActiveAnalyzing ? (
                <div className="p-8 text-center bg-white rounded-2xl border-3 border-black shadow-brutal space-y-3">
                  <div className="flex items-center justify-center gap-2 font-display font-black text-sm text-black">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF5388]" />
                    <span>SYNTHESIZING ROOT CAUSE INSIGHTS...</span>
                  </div>
                  <p className="text-2xs font-mono text-slate-600 font-bold max-w-sm mx-auto">
                    Agent sedang menjalankan eksekusi analitis bertahap dan mendekomposisi kontribusi varians.
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-bold text-black bg-white rounded-2xl border-3 border-black shadow-brutal">
                  Belum ada insight tersedia.
                </div>
              )}

              {/* Level 5: What-If Scenario & Trajectory Simulator */}
              {activeConversation.insights && activeConversation.insights.length > 0 && (
                <WhatIfSimulator conversation={activeConversation} />
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
                        onNewMemory={async () => {
                          const freshMemories = await fetchMemories();
                          if (freshMemories && freshMemories.length > 0) {
                            setMemories(freshMemories);
                          }
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
      <ProactiveModal
        isOpen={isProactiveOpen}
        onClose={() => setIsProactiveOpen(false)}
        statusData={proactiveStatus}
        onScanComplete={handleProactiveScanComplete}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
}

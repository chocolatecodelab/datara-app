"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Sliders,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Conversation, ForecastScenarioResponse, DriverItem } from "../lib/types";
import { fetchForecastScenario } from "../lib/api";

interface WhatIfSimulatorProps {
  conversation: Conversation;
}

export default function WhatIfSimulator({ conversation }: WhatIfSimulatorProps) {
  const insight = conversation.insights?.[0];
  const drivers = insight?.main_drivers || [];

  // Interventions map: { driver_name: percentage 0.0 - 1.0 }
  const [interventions, setInterventions] = useState<Record<string, number>>({});
  const [scenario, setScenario] = useState<ForecastScenarioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<"custom" | "status_quo" | "moderate" | "full">("moderate");

  // Initialize interventions when drivers change
  useEffect(() => {
    if (drivers.length > 0) {
      const initial: Record<string, number> = {};
      drivers.forEach((d, idx) => {
        initial[d.value] = idx === 0 ? 0.65 : 0.5;
      });
      setInterventions(initial);
      setActivePreset("moderate");
    }
  }, [conversation.id]);

  // Recalculate scenario when interventions or conversation change
  useEffect(() => {
    let isCancelled = false;

    async function loadForecast() {
      setIsLoading(true);
      try {
        const res = await fetchForecastScenario(
          {
            metric_name: "Revenue",
            baseline_value: 769930,
            current_value: 650690,
            drivers: drivers,
            interventions: interventions,
            months_ahead: 3,
          },
          conversation.id
        );
        if (!isCancelled) {
          setScenario(res);
        }
      } catch (err) {
        console.error("Forecast calculation error:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadForecast();

    return () => {
      isCancelled = true;
    };
  }, [interventions, conversation.id]);

  // Preset Handlers
  const applyPreset = (preset: "status_quo" | "moderate" | "full") => {
    setActivePreset(preset);
    const updated: Record<string, number> = {};

    drivers.forEach((d, idx) => {
      if (preset === "status_quo") {
        updated[d.value] = 0.0;
      } else if (preset === "moderate") {
        updated[d.value] = idx === 0 ? 0.5 : 0.35;
      } else if (preset === "full") {
        updated[d.value] = idx === 0 ? 0.85 : 0.7;
      }
    });

    setInterventions(updated);
  };

  const handleSliderChange = (driverName: string, value: number) => {
    setActivePreset("custom");
    setInterventions((prev) => ({
      ...prev,
      [driverName]: value / 100.0,
    }));
  };

  if (!insight) return null;

  return (
    <div className="rounded-2xl border-3 border-black bg-white p-6 shadow-brutal-lg space-y-6">
      {/* 1. Header & Level 5 Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-3 border-black pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-[#3B82F6] text-white font-black text-xl shadow-brutal-sm">
            <Sliders className="w-6 h-6 stroke-[2.5]" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono uppercase tracking-widest font-black text-slate-500">
                PREDICTIVE SIMULATION
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#3B82F6] text-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                Level 5: Predict
              </span>
            </div>
            <h3 className="font-display text-lg font-black text-black">
              What-If Scenario & Trajectory Simulator
            </h3>
          </div>
        </div>

        {/* Confidence & Live Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FAF6F0] text-black border-2 border-black shadow-brutal-sm font-mono">
            <span className="h-2 w-2 rounded-full bg-[#2DD4BF] animate-pulse" />
            CONFIDENCE {Math.round((scenario?.confidence_score || 0.92) * 100)}%
          </span>
        </div>
      </div>

      {/* 2. Preset Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF6F0] p-3 rounded-xl border-2 border-black">
        <span className="text-xs font-mono font-black text-black uppercase flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#FF5388]" />
          <span>Quick Scenario Presets:</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => applyPreset("status_quo")}
            className={`px-3 py-1.5 rounded-lg border-2 border-black text-xs font-black transition-all ${
              activePreset === "status_quo"
                ? "bg-[#FF4757] text-white shadow-brutal-sm"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            🔴 Status Quo (0%)
          </button>

          <button
            onClick={() => applyPreset("moderate")}
            className={`px-3 py-1.5 rounded-lg border-2 border-black text-xs font-black transition-all ${
              activePreset === "moderate"
                ? "bg-[#FFD12E] text-black shadow-brutal-sm"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            🟡 Moderate Execution (50%)
          </button>

          <button
            onClick={() => applyPreset("full")}
            className={`px-3 py-1.5 rounded-lg border-2 border-black text-xs font-black transition-all ${
              activePreset === "full"
                ? "bg-[#2DD4BF] text-black shadow-brutal-sm"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            🟢 Full Commitment (85%+)
          </button>
        </div>
      </div>

      {/* 3. Interactive Driver Sliders */}
      <div className="space-y-4">
        <h4 className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center justify-between border-b-2 border-black/20 pb-1.5">
          <span>ROOT-CAUSE INTERVENTION SLIDERS</span>
          <span className="text-[10px] text-slate-500 font-bold normal-case">
            Adjust execution commitment per driver
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drivers.slice(0, 2).map((driver, idx) => {
            const currentVal = Math.round((interventions[driver.value] ?? (idx === 0 ? 0.65 : 0.5)) * 100);

            return (
              <div
                key={driver.value}
                className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                      Driver #{idx + 1} ({driver.dimension})
                    </span>
                    <span className="font-sans text-sm font-black text-black">
                      {driver.value}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg border-2 border-black bg-[#FFD12E] font-mono text-xs font-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {currentVal}% Recovery
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentVal}
                  onChange={(e) => handleSliderChange(driver.value, parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                  <span>0% (No Action)</span>
                  <span>50% (Standard)</span>
                  <span>100% (Full Catchup)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Projected Comparison Cards */}
      {scenario && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {/* Card 1: Status Quo Drift */}
          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-600 block tracking-wider">
              Status Quo (Month +1)
            </span>
            <div className="font-display font-black text-2xl text-[#FF4757] flex items-baseline gap-1">
              <span>${scenario.next_period_status_quo.toLocaleString()}</span>
              <TrendingDown className="w-4 h-4 stroke-[3]" />
            </div>
            <p className="text-[10px] font-mono font-bold text-slate-500">
              Kerugian berlanjut tanpa intervensi
            </p>
          </div>

          {/* Card 2: Simulated Recovery */}
          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-600 block tracking-wider">
              Simulated Target (Month +1)
            </span>
            <div className="font-display font-black text-2xl text-black flex items-baseline gap-1">
              <span>${scenario.next_period_mitigated.toLocaleString()}</span>
              <TrendingUp className="w-4 h-4 text-[#2DD4BF] stroke-[3]" />
            </div>
            <p className="text-[10px] font-mono font-bold text-slate-500">
              Hasil simulasi intervensi terarah
            </p>
          </div>

          {/* Card 3: Net Protected Value (Hero Box) */}
          <div className="p-4 rounded-xl border-2 border-black bg-[#2DD4BF] text-black shadow-brutal space-y-1">
            <span className="text-[11px] font-mono font-black uppercase text-black block tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Net Protected Value</span>
            </span>
            <div className="font-display font-black text-2xl text-black flex items-baseline gap-1.5">
              <span>+${scenario.net_protected_value.toLocaleString()}</span>
              <span className="text-xs font-mono font-black">
                (+{scenario.recovery_percentage}%)
              </span>
            </div>
            <p className="text-[10px] font-mono font-bold text-black/80">
              Nilai finansial berhasil diselamatkan
            </p>
          </div>
        </div>
      )}

      {/* 5. Trajectory 3-Month Visual Comparison */}
      {scenario && scenario.trajectory && (
        <div className="space-y-2.5 pt-2">
          <h4 className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
            <span>3-MONTH PROJECTED TRAJECTORY COMPARISON</span>
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {scenario.trajectory.map((point, idx) => {
              const isProj = point.is_projected;
              const delta = point.mitigated_value - point.status_quo_value;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border-2 border-black font-mono text-xs space-y-1.5 transition-all ${
                    isProj
                      ? "bg-[#FAF6F0] shadow-brutal-sm"
                      : "bg-white border-dashed opacity-80"
                  }`}
                >
                  <span className="text-[10px] font-black text-slate-500 block uppercase truncate">
                    {point.period_label}
                  </span>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-2xs">
                      <span className="text-slate-500">No Action:</span>
                      <span className="font-bold text-[#FF4757]">
                        ${Math.round(point.status_quo_value / 1000)}k
                      </span>
                    </div>
                    <div className="flex justify-between text-2xs">
                      <span className="font-bold text-black">Mitigated:</span>
                      <span className="font-black text-black">
                        ${Math.round(point.mitigated_value / 1000)}k
                      </span>
                    </div>
                  </div>

                  {isProj && (
                    <div className="pt-1 border-t border-black/20 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#2DD4BF] text-black border border-black inline-block">
                        +${Math.round(delta / 1000)}k Saved
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Dynamic Executive Narrative */}
      {scenario && (
        <div className="p-4 rounded-xl border-2 border-black bg-[#FAF6F0] shadow-brutal-sm">
          <div className="flex items-start gap-2.5">
            <span className="px-2 py-0.5 rounded bg-black text-[#FFD12E] font-mono text-xs font-black uppercase shrink-0 mt-0.5">
              FORECAST BRIEF
            </span>
            <p className="font-sans text-sm font-bold text-black leading-relaxed">
              {scenario.narrative_summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

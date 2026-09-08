"use client";

import React, { useState } from "react";
import { Recommendation, ActionStepItem } from "@/lib/types";
import { updateRecommendationStatus, toggleRecommendationStep } from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  Send,
  Share2,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onStatusChange,
}) => {
  const [status, setStatus] = useState(recommendation.status);
  const [steps, setSteps] = useState<ActionStepItem[]>(recommendation.action_steps || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      await updateRecommendationStatus(recommendation.id, "approved");
      setStatus("approved");
      if (onStatusChange) onStatusChange(recommendation.id, "approved");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      await updateRecommendationStatus(recommendation.id, "rejected");
      setStatus("rejected");
      if (onStatusChange) onStatusChange(recommendation.id, "rejected");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStep = async (stepId: number, currentVal: boolean) => {
    const newVal = !currentVal;
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed: newVal } : s))
    );
    await toggleRecommendationStep(recommendation.id, stepId, newVal);
  };

  const handleCopyPlan = () => {
    const text = `*DATARA ACTION PLAN: ${recommendation.title}*\nExpected Recovery: +$${recommendation.estimated_impact_amount.toLocaleString()} (+${recommendation.estimated_impact_pct}%)\nRationale: ${recommendation.rationale}\n\n*Action Steps:*\n${steps.map((s, i) => `${i + 1}. [${s.completed ? "x" : " "}] ${s.step} (PIC: ${s.pic_role})`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isP0 = recommendation.priority.includes("P0");
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  const completedStepsCount = steps.filter((s) => s.completed).length;

  return (
    <div className="bg-white border-3 border-black shadow-brutal-lg p-6 space-y-5 rounded-none transition-all">
      {/* 1. Header Badges & Priority */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-3 border-black pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-mono font-black uppercase bg-[#2DD4BF] text-black border-2 border-black shadow-brutal-sm flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-black" />
            LEVEL 6: ACTION PLAN
          </span>

          <span
            className={`px-2.5 py-1 text-xs font-mono font-black uppercase border-2 border-black shadow-brutal-sm ${
              isP0 ? "bg-[#FF5388] text-white" : "bg-[#FFD12E] text-black"
            }`}
          >
            {recommendation.priority}
          </span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {isApproved ? (
            <span className="px-3 py-1 bg-black text-[#2DD4BF] border-2 border-black font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
              APPROVED & COMMITTED
            </span>
          ) : isRejected ? (
            <span className="px-3 py-1 bg-neutral-200 text-neutral-600 border-2 border-black font-bold line-through">
              REJECTED
            </span>
          ) : (
            <span className="px-3 py-1 bg-[#FAF6F0] text-black border-2 border-black font-bold shadow-brutal-sm animate-pulse flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              PENDING APPROVAL
            </span>
          )}
        </div>
      </div>

      {/* 2. Expected Impact & Recovery Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1: Financial Recovery */}
        <div className="bg-[#FFD12E] border-2 border-black shadow-brutal-sm p-3.5">
          <span className="text-[11px] font-mono font-bold uppercase text-black block tracking-wider">
            Expected Recovery
          </span>
          <div className="font-display font-black text-2xl text-black flex items-baseline gap-1 mt-0.5">
            <span>+${recommendation.estimated_impact_amount.toLocaleString()}</span>
            <span className="text-xs font-mono font-bold text-neutral-800">
              (+{recommendation.estimated_impact_pct}%)
            </span>
          </div>
        </div>

        {/* Metric 2: Confidence */}
        <div className="bg-[#FAF6F0] border-2 border-black shadow-brutal-sm p-3.5">
          <span className="text-[11px] font-mono font-bold uppercase text-neutral-600 block tracking-wider">
            AI Confidence
          </span>
          <div className="font-display font-black text-2xl text-black mt-0.5 flex items-center gap-2">
            <span>{Math.round(recommendation.confidence * 100)}%</span>
            <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5 border border-black">
              Verified
            </span>
          </div>
        </div>

        {/* Metric 3: Difficulty / Target */}
        <div className="bg-[#3B82F6] text-white border-2 border-black shadow-brutal-sm p-3.5">
          <span className="text-[11px] font-mono font-bold uppercase block tracking-wider opacity-90">
            Effort vs Difficulty
          </span>
          <div className="font-display font-black text-2xl mt-0.5">
            {recommendation.difficulty} Effort
          </div>
        </div>
      </div>

      {/* 3. Title & Strategic Rationale */}
      <div className="space-y-2">
        <h3 className="font-display font-extrabold text-xl text-black leading-snug">
          {recommendation.title}
        </h3>
        <p className="text-sm font-sans text-neutral-800 leading-relaxed bg-[#FAF6F0] p-4 border-2 border-black">
          {recommendation.rationale}
        </p>
      </div>

      {/* 4. Interactive Action Checklist */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Operational Action Checklist
            </span>
          </div>
          <span className="text-xs font-mono font-bold bg-[#FFD12E] px-2 py-0.5 border border-black">
            {completedStepsCount} of {steps.length} completed
          </span>
        </div>

        <div className="space-y-2">
          {steps.map((stepItem, index) => (
            <div
              key={stepItem.id}
              onClick={() => handleToggleStep(stepItem.id, stepItem.completed)}
              className={`p-3 border-2 border-black shadow-brutal-sm flex items-start gap-3 cursor-pointer select-none transition-all ${
                stepItem.completed
                  ? "bg-[#2DD4BF]/20 border-black/60 line-through opacity-75"
                  : "bg-white hover:bg-[#FAF6F0]"
              }`}
            >
              {/* Checkbox box */}
              <div
                className={`w-5 h-5 mt-0.5 border-2 border-black flex items-center justify-center font-black text-xs shrink-0 ${
                  stepItem.completed ? "bg-[#2DD4BF] text-black" : "bg-white"
                }`}
              >
                {stepItem.completed ? "✓" : ""}
              </div>

              {/* Step details */}
              <div className="flex-1 text-xs">
                <span className="font-medium text-black">{stepItem.step}</span>
                <div className="mt-1 flex items-center gap-2 font-mono text-[10px]">
                  <span className="bg-black text-white px-1.5 py-0.5 font-bold">
                    PIC: {stepItem.pic_role}
                  </span>
                  <span className="text-neutral-500">Step {index + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Human Approval Gate & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-3 border-black">
        <div className="flex items-center gap-2">
          {!isApproved && !isRejected && (
            <>
              <button
                onClick={handleApprove}
                disabled={isUpdating}
                className="btn-neobrutal bg-[#2DD4BF] hover:bg-[#26bfae] text-black font-display font-extrabold text-xs px-5 py-2.5 rounded-none flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                {isUpdating ? "Approving..." : "⚡ Approve Action Plan"}
              </button>

              <button
                onClick={handleReject}
                disabled={isUpdating}
                className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black border-2 border-black font-mono font-bold text-xs shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
              >
                Reject
              </button>
            </>
          )}

          {isApproved && (
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-black bg-[#2DD4BF] px-3 py-2 border-2 border-black shadow-brutal-sm">
              <span>✓ Plan Approved by Management</span>
            </div>
          )}
        </div>

        {/* Share & Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPlan}
            className="px-3.5 py-2 bg-[#FAF6F0] hover:bg-[#FFD12E] text-black border-2 border-black font-mono font-bold text-xs shadow-brutal-sm flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Export Plan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;

import json
import re
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.agent.prompts import (
    INTENT_DETECTION_PROMPT,
    ANALYSIS_PLANNER_PROMPT,
    INSIGHT_SYNTHESIS_PROMPT,
)


class LLMClient:
    """
    Dual-mode LLM Client for Datara Agent Engine.
    Leverages Google Gemini API for natural language reasoning with automatic deterministic fallback.
    """

    GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    @classmethod
    def is_gemini_available(cls) -> bool:
        return bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)

    @classmethod
    def _clean_json_response(cls, text: str) -> str:
        """Strips markdown code blocks like ```json ... ``` from LLM response."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        return cleaned.strip()

    @classmethod
    def generate_completion(cls, prompt: str, temperature: float = 0.1) -> Optional[str]:
        """Calls Google Gemini API via HTTP POST."""
        if not cls.is_gemini_available():
            return None

        url = f"{cls.GEMINI_API_URL}?key={settings.GEMINI_API_KEY.strip()}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 2048,
                "responseMimeType": "application/json",
            }
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"]
                elif response.status_code == 400:
                    # Retry without responseMimeType if model doesn't support json mode
                    payload["generationConfig"].pop("responseMimeType", None)
                    response2 = client.post(url, headers=headers, json=payload)
                    if response2.status_code == 200:
                        data2 = response2.json()
                        candidates = data2.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
        except Exception as e:
            # Fallback will engage
            pass

        return None

    @classmethod
    def detect_intent(
        cls, user_query: str, semantic_context: str, fallback_metrics: List[str]
    ) -> Dict[str, Any]:
        """Classifies intent using Gemini, falling back to deterministic keyword analysis."""
        prompt = INTENT_DETECTION_PROMPT.format(
            user_query=user_query,
            semantic_context=semantic_context,
        )
        completion = cls.generate_completion(prompt, temperature=0.1)
        if completion:
            try:
                cleaned = cls._clean_json_response(completion)
                return json.loads(cleaned)
            except Exception:
                pass

        # Deterministic Fallback
        query_lower = user_query.lower()
        matched_metric = "Revenue"
        for m in fallback_metrics:
            if m.lower() in query_lower:
                matched_metric = m
                break

        # Check for month mentions
        target_period = "2026-08"
        baseline_period = "2026-07"
        if "juli" in query_lower and "agustus" in query_lower:
            target_period = "2026-08"
            baseline_period = "2026-07"

        return {
            "primary_metric": matched_metric,
            "intent_type": "root_cause_analysis",
            "target_period": target_period,
            "baseline_period": baseline_period,
            "dimensions_to_explore": ["region", "product_name", "product_category"],
            "reasoning_summary": "Deterministic intent mapped to root cause analysis for " + matched_metric,
        }

    @classmethod
    def generate_plan(
        cls,
        user_query: str,
        metric_name: str,
        formula: str,
        source_table: str,
        allowed_dimensions: List[str],
        business_rules: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Generates analytical plan steps using Gemini or deterministic recipe."""
        prompt = ANALYSIS_PLANNER_PROMPT.format(
            user_query=user_query,
            metric_name=metric_name,
            formula=formula,
            source_table=source_table,
            allowed_dimensions=", ".join(allowed_dimensions) if allowed_dimensions else "All",
            business_rules=business_rules or "Standard organization rules",
        )
        completion = cls.generate_completion(prompt, temperature=0.2)
        if completion:
            try:
                cleaned = cls._clean_json_response(completion)
                steps = json.loads(cleaned)
                if isinstance(steps, list) and len(steps) >= 3:
                    return steps
            except Exception:
                pass

        # Deterministic 5-step Standard Analytical Plan
        return [
            {
                "step_order": 1,
                "title": f"Compare baseline vs target period {metric_name}",
                "description": f"Calculate {metric_name} for baseline and target period to measure total delta.",
                "tool_to_use": "execute_query",
            },
            {
                "step_order": 2,
                "title": f"Break down {metric_name} variance by region",
                "description": "Group metric by region across both periods to check regional performance distribution.",
                "tool_to_use": "execute_query",
            },
            {
                "step_order": 3,
                "title": f"Break down {metric_name} variance by product",
                "description": "Group metric by product to detect specific underperforming SKU items.",
                "tool_to_use": "execute_query",
            },
            {
                "step_order": 4,
                "title": "Run multidimensional variance decomposition",
                "description": "Compute exact percentage contribution impact per driver.",
                "tool_to_use": "run_analysis",
            },
            {
                "step_order": 5,
                "title": "Synthesize explainable finding and drivers",
                "description": "Formulate 5-element Explainable Insight Card with evidence.",
                "tool_to_use": "none",
            },
        ]

    @classmethod
    def synthesize_insight(
        cls,
        user_query: str,
        metric_name: str,
        baseline_value: float,
        current_value: float,
        absolute_change: float,
        percentage_change: float,
        direction: str,
        top_drivers: List[Dict[str, Any]],
        total_records: int,
        formula: str,
        data_source: str = "Acme E-Commerce DB",
    ) -> Dict[str, Any]:
        """Synthesizes final 5-element Explainable Insight Card."""
        drivers_text = "\n".join([
            f"- {d.get('dimension')}: {d.get('value')} (Impact: {d.get('impact_pct')}%)"
            for d in top_drivers
        ])

        prompt = INSIGHT_SYNTHESIS_PROMPT.format(
            user_query=user_query,
            metric_name=metric_name,
            baseline_value=f"${baseline_value:,.2f}",
            current_value=f"${current_value:,.2f}",
            absolute_change=f"${absolute_change:,.2f}",
            percentage_change=f"{percentage_change:,.2f}",
            direction=direction,
            drivers_text=drivers_text or "No significant drivers isolated",
            total_records=total_records,
            formula=formula,
        )

        completion = cls.generate_completion(prompt, temperature=0.2)
        if completion:
            try:
                cleaned = cls._clean_json_response(completion)
                res = json.loads(cleaned)
                if "finding" in res and "calculation" in res:
                    return res
            except Exception:
                pass

        # Deterministic synthesis
        top_driver_name = top_drivers[0]["value"] if top_drivers else "Unknown"
        top_driver_impact = top_drivers[0]["impact_pct"] if top_drivers else 0.0
        top_driver_dim = top_drivers[0]["dimension"] if top_drivers else ""

        finding = (
            f"{metric_name} mengalami penurunan sebesar {abs(percentage_change):.1f}% pada periode target. "
            f"Faktor kontributor utama teridentifikasi pada {top_driver_dim} '{top_driver_name}' "
            f"yang menyumbang dampak sekitar {abs(top_driver_impact):.1f}% dari total perubahan."
            if direction == "decrease"
            else f"{metric_name} mencatatkan pertumbuhan sebesar +{percentage_change:.1f}% pada periode target."
        )

        return {
            "finding": finding,
            "evidence": f"Dianalisis dari {total_records:,} catatan transaksi pada {data_source}.",
            "evidence_rows": total_records,
            "calculation": formula,
            "confidence": 0.93 if total_records > 500 else 0.85,
            "main_drivers": top_drivers,
            "data_source": data_source,
        }

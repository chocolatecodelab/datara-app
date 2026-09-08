"""
Prompt Templates for Datara AI Agentic Data Analyst Engine.
Designed to guarantee deterministic alignment with the Semantic Layer and Governance boundaries.
"""

INTENT_DETECTION_PROMPT = """
You are an expert AI Data Analyst Intent Classifier for Datara.
Analyze the user's business question or goal and map it to our official Semantic Layer.

### Semantic Layer Context:
{semantic_context}

### User Input:
"{user_query}"

### Instructions:
1. Identify the primary business metric (match against Semantic Layer definitions or synonyms).
2. Determine the analytical intent:
   - "root_cause_analysis" (e.g., investigating why a metric dropped or grew)
   - "metric_comparison" (e.g., comparing periods or segments)
   - "trend_analysis" (e.g., tracking performance over time)
   - "general_query"
3. Extract the target analysis period (e.g., "2026-08" or "August 2026") and baseline period (e.g., "2026-07" or "July 2026").
4. Identify candidate dimensions for drill-down from the allowed dimensions.

Return ONLY a valid JSON object with this exact structure:
{{
  "primary_metric": "Revenue",
  "intent_type": "root_cause_analysis",
  "target_period": "2026-08",
  "baseline_period": "2026-07",
  "dimensions_to_explore": ["region", "product_name", "product_category"],
  "reasoning_summary": "Brief 1-sentence reasoning"
}}
"""

ANALYSIS_PLANNER_PROMPT = """
You are the Autonomous Analysis Planner for Datara AI Agentic Data Analyst.
Your role is to formulate a structured, progressive 4 to 8-step analytical plan to investigate the user's business goal.

### Goal:
"{user_query}"

### Target Metric Details:
- Metric Name: {metric_name}
- Formula: {formula}
- Source Table: {source_table}
- Allowed Dimensions: {allowed_dimensions}
- Business Rules: {business_rules}

### Available Tools:
1. `execute_query`: Run read-only SQL queries in the sandbox
2. `run_analysis`: Compute variance decomposition and contribution driver percentages

### Plan Formulation Guidelines:
- Step 1: Compare total metric value between baseline period and current target period.
- Step 2: Decompose and breakdown metric by primary dimension (e.g., region).
- Step 3: Decompose and breakdown metric by secondary dimension (e.g., product or category).
- Step 4: Identify and isolate the strongest negative/positive contributors.
- Step 5: Validate findings against business rules and synthesize explainable insights.

Return ONLY a valid JSON array of step objects with this exact structure:
[
  {{
    "step_order": 1,
    "title": "Compare baseline vs target period total metric",
    "description": "Calculate total value for baseline period and current period to measure overall delta.",
    "tool_to_use": "execute_query"
  }},
  {{
    "step_order": 2,
    "title": "Break down metric variance by region",
    "description": "Group metric by region across both periods to check regional performance.",
    "tool_to_use": "execute_query"
  }},
  {{
    "step_order": 3,
    "title": "Break down metric variance by product",
    "description": "Group metric by product to detect specific underperforming SKU items.",
    "tool_to_use": "execute_query"
  }},
  {{
    "step_order": 4,
    "title": "Run multidimensional variance decomposition",
    "description": "Calculate exact impact percentage contribution per driver.",
    "tool_to_use": "run_analysis"
  }},
  {{
    "step_order": 5,
    "title": "Synthesize explainable finding and drivers",
    "description": "Formulate 5-element Explainable Insight Card with evidence.",
    "tool_to_use": "none"
  }}
]
"""

INSIGHT_SYNTHESIS_PROMPT = """
You are the Insight Synthesis Engine for Datara AI Agentic Data Analyst.
Synthesize the investigation findings into a rigorous, executive-level 5-element Explainable Insight.

### User Goal / Question:
"{user_query}"

### Analysis Execution Evidence & Findings:
- Target Metric: {metric_name}
- Baseline Value: {baseline_value}
- Current Target Value: {current_value}
- Absolute Delta: {absolute_change}
- Percentage Delta: {percentage_change}% ({direction})
- Top Driver Breakdown:
{drivers_text}
- Total Records Analyzed: {total_records}
- Formula Used: {formula}

### Instructions:
Write an executive finding narrative in professional Indonesian/English (matching user query language).
State the exact overall change and highlight the primary contributor(s) and their percentage impact.
Do NOT hallucinate numbers; use the exact calculations provided above.

Return ONLY a valid JSON object with this exact structure:
{{
  "finding": "Pendapatan (Revenue) turun sebesar 15.5% pada Agustus 2026. Penurunan ini didorong utamanya oleh anomali penurunan penjualan Product Alpha (Flagship) di wilayah East Java yang berkontribusi sebesar ~62% dari total penurunan.",
  "evidence": "Dianalisis dari 1,480 transaksi pesanan di database e-commerce.",
  "evidence_rows": {total_records},
  "calculation": "{formula}",
  "confidence": 0.92,
  "main_drivers": [
    {{
      "dimension": "product_name",
      "value": "Product Alpha (Flagship)",
      "impact_pct": -62.4
    }},
    {{
      "dimension": "region",
      "value": "East Java",
      "impact_pct": -54.2
    }}
  ],
  "data_source": "Acme E-Commerce DB (PostgreSQL/SQLite)"
}}
"""

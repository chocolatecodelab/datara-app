from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class OutcomeEvaluationRequest(BaseModel):
    actual_recovery_amount: Optional[float] = None
    evaluation_period: Optional[str] = "30-Day Post-Intervention"
    notes: Optional[str] = None


class OutcomeEvaluationResult(BaseModel):
    recommendation_id: str
    title: str
    target_dimension: str
    expected_recovery_amount: float
    expected_impact_pct: float
    actual_recovery_amount: float
    actual_impact_pct: float
    realization_rate_pct: float
    variance_amount: float
    effectiveness_grade: str  # "A+", "A", "B", "C"
    evaluation_period: str
    learned_heuristic_text: str
    memory_id: Optional[str] = None
    evaluated_at: str

    model_config = ConfigDict(from_attributes=True)


class InterventionMetricSummary(BaseModel):
    intervention_type: str
    total_dispatched: int
    avg_realization_rate_pct: float
    total_recovered_amount: float


class OutcomeAnalyticsSummary(BaseModel):
    total_actions_evaluated: int
    total_expected_recovery: float
    total_actual_recovery: float
    overall_realization_rate_pct: float
    learned_heuristics_count: int
    top_interventions: List[InterventionMetricSummary] = []

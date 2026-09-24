from typing import List, Optional
from pydantic import BaseModel
from app.schemas.conversation import DriverItem


class DimensionVarianceItem(BaseModel):
    dimension_name: str
    drivers: List[DriverItem] = []
    dimension_total_impact: float


class VarianceAnalysisRequest(BaseModel):
    metric_name: str
    current_period_sql: Optional[str] = None
    previous_period_sql: Optional[str] = None
    dimensions: List[str] = []
    # If providing raw values directly for calculation:
    baseline_value: Optional[float] = None
    current_value: Optional[float] = None


class VarianceAnalysisResponse(BaseModel):
    metric_name: str
    previous_value: float
    current_value: float
    absolute_change: float
    percentage_change: float
    direction: str  # "increase" | "decrease" | "neutral"
    top_drivers: List[DriverItem] = []
    dimension_breakdowns: List[DimensionVarianceItem] = []
    confidence_score: float
    evidence_summary: str


class DriverInterventionItem(BaseModel):
    dimension: str
    driver_name: str
    deficit_amount: float
    intervention_pct: float  # 0.0 to 1.0 (e.g. 0.65 = 65%)
    recovered_amount: float


class ForecastTrajectoryPoint(BaseModel):
    period_label: str
    is_projected: bool
    status_quo_value: float
    mitigated_value: float


class ForecastScenarioRequest(BaseModel):
    metric_name: str = "Revenue"
    baseline_value: float
    current_value: float
    drivers: List[DriverItem] = []
    interventions: Optional[dict[str, float]] = None  # { "East Java": 0.65 }
    months_ahead: int = 3


class ForecastScenarioResponse(BaseModel):
    metric_name: str
    baseline_value: float
    current_value: float
    trajectory: List[ForecastTrajectoryPoint] = []
    driver_interventions: List[DriverInterventionItem] = []
    next_period_status_quo: float
    next_period_mitigated: float
    net_protected_value: float
    recovery_percentage: float
    confidence_score: float
    narrative_summary: str


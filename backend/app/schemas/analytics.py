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

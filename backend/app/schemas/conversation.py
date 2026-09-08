from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class DriverItem(BaseModel):
    dimension: str
    value: str
    impact_pct: float
    previous_val: Optional[float] = None
    current_val: Optional[float] = None


class ToolCallResponse(BaseModel):
    id: str
    analysis_step_id: str
    tool_name: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]
    executed_sql: Optional[str] = None
    latency_ms: Optional[int] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisStepResponse(BaseModel):
    id: str
    conversation_id: str
    step_order: int
    title: str
    description: Optional[str] = None
    status: str  # pending, in_progress, completed, failed
    duration_ms: Optional[int] = None
    result_summary: Optional[str] = None
    created_at: datetime
    tool_calls: List[ToolCallResponse] = []

    model_config = ConfigDict(from_attributes=True)


class InsightResponse(BaseModel):
    id: str
    conversation_id: str
    finding: str
    evidence: str
    evidence_rows: int
    calculation: str
    confidence: float
    main_drivers: List[DriverItem] = []
    data_source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    goal_or_question: str
    organization_id: Optional[str] = None
    user_id: Optional[str] = "default_user"


class ConversationResponse(BaseModel):
    id: str
    organization_id: str
    user_id: str
    goal_or_question: str
    status: str
    created_at: datetime
    steps: List[AnalysisStepResponse] = []
    insights: List[InsightResponse] = []

    model_config = ConfigDict(from_attributes=True)

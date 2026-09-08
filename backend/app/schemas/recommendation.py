from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ActionStepItem(BaseModel):
    id: int
    step: str
    pic_role: str
    completed: bool = False


class RecommendationBase(BaseModel):
    title: str
    rationale: str
    target_dimension: Optional[str] = None
    estimated_impact_amount: float = 0.0
    estimated_impact_pct: float = 0.0
    confidence: float = 0.85
    priority: str = "P1 - High"
    difficulty: str = "Medium"
    action_steps: List[ActionStepItem] = []
    status: str = "pending_approval"


class RecommendationCreate(RecommendationBase):
    conversation_id: str


class RecommendationResponse(RecommendationBase):
    id: str
    conversation_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecommendationStatusUpdate(BaseModel):
    status: str  # pending_approval, approved, rejected, in_progress


class ActionStepToggle(BaseModel):
    step_id: int
    completed: bool

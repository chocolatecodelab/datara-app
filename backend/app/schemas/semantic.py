from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class SemanticMetricBase(BaseModel):
    name: str
    formula: str
    source_table: str
    owner: Optional[str] = "data_team"
    refresh_frequency: Optional[str] = "daily"
    allowed_dimensions: List[str] = []
    business_terms: List[str] = []
    business_rules: Optional[str] = None


class SemanticMetricCreate(SemanticMetricBase):
    organization_id: Optional[str] = None


class SemanticMetricUpdate(BaseModel):
    name: Optional[str] = None
    formula: Optional[str] = None
    source_table: Optional[str] = None
    owner: Optional[str] = None
    refresh_frequency: Optional[str] = None
    allowed_dimensions: Optional[List[str]] = None
    business_terms: Optional[List[str]] = None
    business_rules: Optional[str] = None


class SemanticMetricResponse(SemanticMetricBase):
    id: str
    organization_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MetricLookupResponse(BaseModel):
    matched_term: str
    metric: SemanticMetricResponse
    confidence: float

from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class AnomalyItem(BaseModel):
    id: str
    metric_name: str
    dimension: Optional[str] = None
    target_period: str
    baseline_period: str
    previous_value: float
    current_value: float
    deviation_pct: float
    severity: str  # "CRITICAL" | "HIGH" | "MEDIUM"
    detected_at: str
    description: str


class ProactiveScanResult(BaseModel):
    anomalies_detected: List[AnomalyItem] = []
    autonomous_investigation_triggered: bool
    conversation_id: Optional[str] = None
    message: str


class DepartmentTicket(BaseModel):
    ticket_id: str
    pic_role: str
    action_step: str
    priority: str
    status: str = "DISPATCHED"
    created_at: str


class ActionDispatchResult(BaseModel):
    recommendation_id: str
    title: str
    dispatched: bool
    webhook_url: str
    webhook_status: str
    latency_ms: int
    tickets_created: List[DepartmentTicket] = []
    dispatched_at: str


class ProactiveStatusResponse(BaseModel):
    watcher_status: str  # "ACTIVE" | "IDLE"
    last_scan_at: str
    monitored_metrics_count: int
    recent_anomalies_count: int
    recent_anomalies: List[AnomalyItem] = []

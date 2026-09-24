from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AlertChannel(BaseModel):
    id: str
    name: str
    channel_type: str = Field(..., description="'slack', 'email', or 'webhook'")
    destination: str = Field(..., description="Slack channel/webhook, email recipient, or endpoint URL")
    is_active: bool = True
    min_severity: str = Field("ALL", description="'ALL', 'HIGH', or 'CRITICAL'")
    created_at: str


class AlertChannelCreate(BaseModel):
    name: str
    channel_type: str
    destination: str
    is_active: bool = True
    min_severity: str = "ALL"


class AlertNotificationPayload(BaseModel):
    title: str
    severity: str = Field("HIGH", description="'INFO', 'HIGH', or 'CRITICAL'")
    category: str = Field("METRIC_ANOMALY", description="'METRIC_ANOMALY', 'DATA_QUALITY', 'ACTION_APPROVED'")
    message: str
    metrics_summary: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    source_system: str = "Datara Autonomous Sentinel"
    timestamp: str


class AlertDispatchLog(BaseModel):
    id: str
    channel_id: Optional[str] = None
    channel_name: str
    channel_type: str
    destination: str
    status: str = Field("DELIVERED", description="'DELIVERED', 'SIMULATED', 'FAILED'")
    latency_ms: int
    payload_preview: str
    sent_at: str


class AlertTestRequest(BaseModel):
    channel_type: str = "slack"
    destination: Optional[str] = None
    custom_message: Optional[str] = None


class AlertingSummary(BaseModel):
    active_channels_count: int
    total_alerts_sent_24h: int
    delivery_success_rate_pct: float
    last_alert_timestamp: Optional[str] = None
    recent_logs: List[AlertDispatchLog]

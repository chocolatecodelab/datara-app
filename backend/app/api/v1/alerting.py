from typing import List
from fastapi import APIRouter, HTTPException
from app.analytics.alerting_service import AlertingService
from app.schemas.alerting import (
    AlertChannel,
    AlertChannelCreate,
    AlertTestRequest,
    AlertDispatchLog,
    AlertingSummary,
)

router = APIRouter()


@router.get("/channels", response_model=List[AlertChannel])
def get_alert_channels():
    """Lists all configured real-time alert notification channels."""
    return AlertingService.list_channels()


@router.post("/channels", response_model=AlertChannel, status_code=201)
def add_alert_channel(payload: AlertChannelCreate):
    """Registers a new Slack, Email, or Webhook alert channel."""
    return AlertingService.add_channel(payload)


@router.delete("/channels/{channel_id}", status_code=204)
def delete_alert_channel(channel_id: str):
    """Removes an alert notification channel."""
    success = AlertingService.delete_channel(channel_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert channel not found.")
    return None


@router.post("/test", response_model=AlertDispatchLog)
def send_test_alert(payload: AlertTestRequest):
    """Triggers an instant simulated test alert to Slack, Email, or Webhook."""
    return AlertingService.test_channel_dispatch(
        channel_type=payload.channel_type,
        destination=payload.destination,
        custom_message=payload.custom_message,
    )


@router.get("/logs", response_model=List[AlertDispatchLog])
def get_alert_dispatch_logs():
    """Returns recent notification dispatch logs and delivery statuses."""
    return AlertingService.get_logs()


@router.get("/summary", response_model=AlertingSummary)
def get_alerting_summary():
    """Returns aggregated summary metrics for alerting (active channels, delivery rate)."""
    return AlertingService.get_summary()

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.analytics.alerting_service import AlertingService
from app.schemas.alerting import AlertNotificationPayload, AlertChannelCreate

client = TestClient(app)


def test_alerting_slack_and_email_formatting():
    payload = AlertNotificationPayload(
        title="Revenue Drop Alert",
        severity="CRITICAL",
        category="METRIC_ANOMALY",
        message="Revenue decreased by 20.7% in East Java",
        metrics_summary="-$64,600 deficit",
        action_url="http://localhost:3000/investigate",
        timestamp=datetime.utcnow().isoformat(),
    )

    # 1. Slack Block Kit Format Test
    slack_data = AlertingService.format_slack_block_kit(payload)
    assert "attachments" in slack_data
    blocks = slack_data["attachments"][0]["blocks"]
    assert any(b["type"] == "header" for b in blocks)
    assert any(b["type"] == "actions" for b in blocks)

    # 2. Email Digest Format Test
    email_data = AlertingService.format_executive_email(payload)
    assert "[DATARA ALERT: CRITICAL]" in email_data["subject"]
    assert "East Java" in email_data["html"]


def test_alerting_dispatch_and_severity_filtering():
    # Dispatch an INFO payload
    info_payload = AlertNotificationPayload(
        title="Routine Metric Scan Completed",
        severity="INFO",
        category="SYSTEM",
        message="Metrics scanned within baseline variation",
        timestamp=datetime.utcnow().isoformat(),
    )

    # Channel ch-1 requires HIGH, ch-2 requires CRITICAL, ch-3 allows ALL
    logs = AlertingService.dispatch_alert(info_payload)
    # Only channels allowing INFO/ALL should receive it
    channel_types = [l.channel_type for l in logs]
    assert "webhook" in channel_types

    # Dispatch a CRITICAL payload
    crit_payload = AlertNotificationPayload(
        title="Critical Anomaly Alert",
        severity="CRITICAL",
        category="METRIC_ANOMALY",
        message="Severe regional revenue deficit detected",
        timestamp=datetime.utcnow().isoformat(),
    )
    crit_logs = AlertingService.dispatch_alert(crit_payload)
    assert len(crit_logs) >= 2


def test_alerting_api_endpoints():
    # 1. GET /api/v1/alerting/channels
    res = client.get("/api/v1/alerting/channels")
    assert res.status_code == 200
    channels = res.json()
    assert len(channels) >= 2

    # 2. POST /api/v1/alerting/channels
    new_ch = {
        "name": "DevOps PagerDuty",
        "channel_type": "webhook",
        "destination": "https://events.pagerduty.com/v2/enqueue",
        "is_active": True,
        "min_severity": "CRITICAL",
    }
    res_add = client.post("/api/v1/alerting/channels", json=new_ch)
    assert res_add.status_code == 201
    created = res_add.json()
    assert created["name"] == "DevOps PagerDuty"
    ch_id = created["id"]

    # 3. POST /api/v1/alerting/test
    res_test = client.post(
        "/api/v1/alerting/test",
        json={"channel_type": "slack", "destination": "#exec-alerts", "custom_message": "Pytest verified ping"},
    )
    assert res_test.status_code == 200
    test_log = res_test.json()
    assert test_log["status"] == "DELIVERED"

    # 4. GET /api/v1/alerting/logs
    res_logs = client.get("/api/v1/alerting/logs")
    assert res_logs.status_code == 200
    logs = res_logs.json()
    assert len(logs) > 0

    # 5. GET /api/v1/alerting/summary
    res_sum = client.get("/api/v1/alerting/summary")
    assert res_sum.status_code == 200
    summary = res_sum.json()
    assert summary["active_channels_count"] > 0
    assert summary["delivery_success_rate_pct"] > 90

    # 6. DELETE /api/v1/alerting/channels/{id}
    res_del = client.delete(f"/api/v1/alerting/channels/{ch_id}")
    assert res_del.status_code == 204

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analytics.forecasting import ForecastingEngine
from app.schemas.conversation import DriverItem

client = TestClient(app)


def test_forecasting_engine_math():
    drivers = [
        DriverItem(
            dimension="region",
            value="East Java",
            impact_pct=-54.2,
            previous_val=312400.0,
            current_val=247800.0,
        ),
        DriverItem(
            dimension="product",
            value="Product Alpha",
            impact_pct=-48.1,
            previous_val=260000.0,
            current_val=202650.0,
        ),
    ]

    # Test with custom interventions
    interventions = {
        "East Java": 0.65,
        "Product Alpha": 0.50,
    }

    res = ForecastingEngine.predict_scenario(
        metric_name="Revenue",
        baseline_value=769930.0,
        current_value=650690.0,
        drivers=drivers,
        interventions=interventions,
        months_ahead=3,
    )

    assert res.metric_name == "Revenue"
    assert len(res.trajectory) == 5  # Baseline, Current, Month +1, Month +2, Month +3
    assert len(res.driver_interventions) == 2

    # Status Quo should continue declining
    month_1_sq = res.trajectory[2].status_quo_value
    assert month_1_sq < res.current_value

    # Mitigated should be higher than current and status quo
    month_1_mit = res.trajectory[2].mitigated_value
    assert month_1_mit > res.current_value
    assert month_1_mit > month_1_sq

    # Net protected value should equal difference
    assert res.net_protected_value == round(month_1_mit - month_1_sq, 2)
    assert res.net_protected_value > 0
    assert res.recovery_percentage > 0
    assert len(res.narrative_summary) > 20


def test_forecast_api_endpoints():
    # 1. Test POST /api/v1/analytics/forecast
    payload = {
        "metric_name": "Revenue",
        "baseline_value": 769930.0,
        "current_value": 650690.0,
        "drivers": [
            {
                "dimension": "region",
                "value": "East Java",
                "impact_pct": -54.2,
                "previous_val": 312400.0,
                "current_val": 247800.0,
            }
        ],
        "interventions": {"East Java": 0.80},
        "months_ahead": 3,
    }

    post_res = client.post("/api/v1/analytics/forecast", json=payload)
    assert post_res.status_code == 200
    data = post_res.json()
    assert data["net_protected_value"] > 0
    assert len(data["trajectory"]) == 5

    # 2. Test GET /api/v1/conversations/{conv_id}/forecast
    # First create a sync conversation
    create_res = client.post(
        "/api/v1/conversations?sync=true",
        json={"goal_or_question": "Investigasi forecast test", "user_id": "test_user"},
    )
    assert create_res.status_code == 201
    conv_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/conversations/{conv_id}/forecast")
    assert get_res.status_code == 200
    conv_forecast = get_res.json()
    assert conv_forecast["metric_name"] == "Revenue"
    assert conv_forecast["net_protected_value"] > 0

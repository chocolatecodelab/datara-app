import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_semantic_metrics_endpoints():
    # List metrics
    res = client.get("/api/v1/semantic-layer/metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert len(metrics) >= 3

    # Lookup metric by synonym
    res_lookup = client.get("/api/v1/semantic-layer/metrics/lookup?term=sales")
    assert res_lookup.status_code == 200
    data = res_lookup.json()
    assert data["metric"]["name"] == "Revenue"


def test_sandbox_validate_sql_api():
    # Valid query
    res = client.post("/api/v1/sandbox/validate-sql", json={
        "sql": "SELECT id, name FROM products WHERE unit_price > 50"
    })
    assert res.status_code == 200
    assert res.json()["is_valid"] is True

    # Reject forbidden SQL
    res_bad = client.post("/api/v1/sandbox/validate-sql", json={
        "sql": "DROP TABLE products;"
    })
    assert res_bad.status_code == 200
    assert res_bad.json()["is_valid"] is False


def test_sandbox_execute_api():
    res = client.post("/api/v1/sandbox/execute", json={
        "sql": "SELECT name, category, unit_price FROM products LIMIT 5"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["row_count"] > 0
    assert "name" in data["columns"]


def test_analytics_variance_api():
    res = client.post("/api/v1/analytics/variance", json={
        "metric_name": "Revenue",
        "baseline_value": 500000.0,
        "current_value": 425000.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["metric_name"] == "Revenue"
    assert data["absolute_change"] == -75000.0
    assert data["direction"] == "decrease"
    assert len(data["top_drivers"]) > 0

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analytics.federated_engine import FederatedQueryEngine
from app.schemas.federation import (
    FederatedJoinRequest,
    FederatedSourceQuery,
    FederatedJoinClause,
)

client = TestClient(app)


def test_federated_query_engine_inner_join():
    request = FederatedJoinRequest(
        sources=[
            FederatedSourceQuery(
                alias="sales",
                sql="SELECT o.id AS order_id, o.customer_id, o.month FROM orders o LIMIT 20",
            ),
            FederatedSourceQuery(
                alias="crm",
                sql="SELECT c.id AS customer_ref_id, c.name AS customer_name, c.region FROM customers c",
            ),
        ],
        joins=[
            FederatedJoinClause(
                left_alias="sales",
                right_alias="crm",
                left_on="customer_id",
                right_on="customer_ref_id",
                how="inner",
            ),
        ],
        max_rows=10,
    )

    result = FederatedQueryEngine.execute_federated_join(request)
    assert result.success is True
    assert result.total_rows > 0
    assert result.total_rows <= 10
    assert "order_id" in result.columns
    assert "customer_name" in result.columns
    assert "region" in result.columns
    assert len(result.lineage) == 2
    assert result.lineage[0].alias == "sales"
    assert result.lineage[1].alias == "crm"
    assert "Federated 2 heterogeneous sources" in result.join_summary


def test_federated_query_engine_missing_key_error():
    request = FederatedJoinRequest(
        sources=[
            FederatedSourceQuery(
                alias="sales",
                sql="SELECT o.id, o.month FROM orders o LIMIT 5",
            ),
            FederatedSourceQuery(
                alias="crm",
                sql="SELECT c.id, c.name FROM customers c LIMIT 5",
            ),
        ],
        joins=[
            FederatedJoinClause(
                left_alias="sales",
                right_alias="crm",
                left_on="non_existent_key",
                right_on="id",
                how="inner",
            ),
        ],
    )

    result = FederatedQueryEngine.execute_federated_join(request)
    assert result.success is False
    assert result.total_rows == 0
    assert "non_existent_key" in result.error_message


def test_federation_api_endpoints():
    # 1. Test GET /api/v1/federation/sample
    res_sample = client.get("/api/v1/federation/sample")
    assert res_sample.status_code == 200
    sample_data = res_sample.json()
    assert len(sample_data["sources"]) == 2
    assert len(sample_data["joins"]) == 1

    # 2. Test GET /api/v1/federation/run-sample
    res_run = client.get("/api/v1/federation/run-sample")
    assert res_run.status_code == 200
    run_data = res_run.json()
    assert run_data["success"] is True
    assert run_data["total_rows"] > 0
    assert len(run_data["lineage"]) == 2

    # 3. Test POST /api/v1/federation/federate
    res_post = client.post("/api/v1/federation/federate", json=sample_data)
    assert res_post.status_code == 200
    post_data = res_post.json()
    assert post_data["success"] is True
    assert len(post_data["data"]) > 0
    assert "order_id" in post_data["columns"]

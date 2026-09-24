import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.models.datasource import DataSource
from app.analytics.data_quality_agent import DataQualityAgent


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def setup_test_datasource(db_session):
    org = Organization(name="Test Quality Org")
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)

    ds = DataSource(
        organization_id=org.id,
        name="Production Retail Data Source",
        type="sqlite",
        connection_meta={"database_url": "sqlite:///./datara_demo.db"},
    )
    db_session.add(ds)
    db_session.commit()
    db_session.refresh(ds)

    return org, ds


def test_data_quality_audit_profiling(db_session, setup_test_datasource):
    org, ds = setup_test_datasource

    report = DataQualityAgent.run_quality_audit(ds.id, db_session)

    assert report.data_source_id == ds.id
    assert report.data_source_name == ds.name
    assert report.overall_score >= 0.0
    assert report.status in ("PASSED", "WARNING", "CRITICAL")
    assert report.tables_count > 0
    assert len(report.tables) > 0

    first_table = report.tables[0]
    assert first_table.total_rows >= 0
    assert first_table.table_score >= 0.0
    assert len(first_table.columns) > 0

    first_col = first_table.columns[0]
    assert first_col.column_name is not None
    assert first_col.null_pct >= 0.0
    assert isinstance(first_col.is_clean, bool)


def test_data_quality_api_endpoints(setup_test_datasource):
    client = TestClient(app)
    org, ds = setup_test_datasource

    # 1. Test GET /api/v1/quality/{ds_id}
    res = client.get(f"/api/v1/quality/{ds.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source_id"] == ds.id
    assert "overall_score" in data
    assert len(data["tables"]) > 0

    # 2. Test POST /api/v1/quality/{ds_id}/scan
    scan_res = client.post(f"/api/v1/quality/{ds.id}/scan")
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["status"] in ("PASSED", "WARNING", "CRITICAL")

    # 3. Test GET /api/v1/quality/summary
    summary_res = client.get("/api/v1/quality/summary")
    assert summary_res.status_code == 200
    sum_data = summary_res.json()
    assert sum_data["overall_health_score"] > 0
    assert sum_data["monitored_sources_count"] >= 1

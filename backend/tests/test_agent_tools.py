import pytest
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.agent.tools import AgentTools


def test_agent_lookup_metric_tool():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        assert org is not None

        metric_info = AgentTools.lookup_metric("Revenue", org.id, db)
        assert metric_info is not None
        assert metric_info["name"] == "Revenue"
        assert "SUM(order_items.amount)" in metric_info["formula"]
    finally:
        db.close()


def test_agent_search_schema_tool():
    schema = AgentTools.search_schema()
    assert isinstance(schema, list)
    table_names = [t["table"] for t in schema]
    assert "orders" in table_names
    assert "order_items" in table_names
    assert "products" in table_names
    assert "customers" in table_names


def test_agent_generate_and_execute_sql():
    sql = AgentTools.generate_sql("Revenue", dimension="region", month_filter="2026-08")
    assert "SELECT c.region" in sql
    assert "WHERE o.month = '2026-08'" in sql

    res = AgentTools.execute_query(sql)
    assert res.success is True
    assert res.row_count > 0
    assert "dimension_value" in res.columns
    assert "total_value" in res.columns

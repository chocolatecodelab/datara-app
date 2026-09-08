import pytest
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.models.semantic import SemanticMetric
from app.semantic.engine import SemanticEngine


def test_semantic_lookup():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        assert org is not None, "Organization must exist"

        # Lookup exact name
        res_exact = SemanticEngine.lookup_metric("Revenue", org.id, db)
        assert res_exact is not None
        metric, confidence = res_exact
        assert metric.name == "Revenue"
        assert confidence == 1.0

        # Lookup synonym "omzet"
        res_synonym = SemanticEngine.lookup_metric("omzet", org.id, db)
        assert res_synonym is not None
        metric, confidence = res_synonym
        assert metric.name == "Revenue"
        assert confidence >= 0.9

        # Lookup synonym "volume transaksi" -> Order Count
        res_order = SemanticEngine.lookup_metric("volume transaksi", org.id, db)
        assert res_order is not None
        metric, confidence = res_order
        assert metric.name == "Order Count"
    finally:
        db.close()


def test_dimension_validation():
    metric = SemanticMetric(
        name="Revenue",
        formula="SUM(amount)",
        source_table="order_items",
        allowed_dimensions=["region", "product_category"],
    )
    assert SemanticEngine.is_dimension_allowed(metric, "region") is True
    assert SemanticEngine.is_dimension_allowed(metric, "product_category") is True
    assert SemanticEngine.is_dimension_allowed(metric, "unauthorized_dim") is False

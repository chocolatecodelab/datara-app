import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class SemanticMetric(Base):
    __tablename__ = "semantic_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False, index=True)  # e.g., "Revenue", "Order Count"
    formula = Column(String(255), nullable=False)           # e.g., "SUM(order_items.amount)"
    source_table = Column(String(100), nullable=False)      # e.g., "order_items"
    owner = Column(String(100), default="data_team")        # e.g., "finance_team"
    refresh_frequency = Column(String(50), default="daily") # e.g., "daily", "realtime"
    allowed_dimensions = Column(JSON, default=list)         # e.g., ["region", "product", "customer_segment"]
    business_terms = Column(JSON, default=list)             # e.g., ["sales", "omzet", "penjualan"]
    business_rules = Column(Text, nullable=True)            # e.g., "Revenue excludes tax and returns"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="metrics")

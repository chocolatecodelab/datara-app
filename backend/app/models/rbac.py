import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)          # Admin, Analyst, Viewer, Marketing, Finance
    allowed_datasets = Column(JSON, default=list)      # ["orders", "order_items", "products"]
    restricted_fields = Column(JSON, default=list)     # ["user_salary", "customer_credit_card", "customer_phone"]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="roles")

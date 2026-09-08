import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class AgentMemory(Base):
    __tablename__ = "agent_memory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    instruction_text = Column(Text, nullable=False)  # e.g., "Revenue excludes tax unless stated otherwise"
    category = Column(String(50), default="business_rule")  # business_rule, metric_override, organization_context
    added_by = Column(String(100), default="system")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="memories")

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(100), default="default_user", nullable=False)
    goal_or_question = Column(Text, nullable=False)
    status = Column(String(50), default="planning", nullable=False)  # planning, analyzing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="conversations")
    steps = relationship("AnalysisStep", back_populates="conversation", cascade="all, delete-orphan", order_by="AnalysisStep.step_order")
    insights = relationship("Insight", back_populates="conversation", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="conversation", cascade="all, delete-orphan")


class AnalysisStep(Base):
    __tablename__ = "analysis_steps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    step_order = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, in_progress, completed, failed
    duration_ms = Column(Integer, nullable=True)
    result_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="steps")
    tool_calls = relationship("ToolCall", back_populates="analysis_step", cascade="all, delete-orphan")


class ToolCall(Base):
    __tablename__ = "tool_calls"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_step_id = Column(String(36), ForeignKey("analysis_steps.id", ondelete="CASCADE"), nullable=False)
    tool_name = Column(String(100), nullable=False)
    arguments = Column(JSON, default=dict)
    result = Column(JSON, default=dict)
    executed_sql = Column(Text, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    status = Column(String(50), default="completed", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    analysis_step = relationship("AnalysisStep", back_populates="tool_calls")


class Insight(Base):
    __tablename__ = "insights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    finding = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)              # e.g., "Analyzed from 72,481 transactions"
    evidence_rows = Column(Integer, default=0)
    calculation = Column(String(255), nullable=False)    # e.g., "Revenue = SUM(order_items.amount)"
    confidence = Column(Float, default=0.85)             # e.g., 0.87 (87%)
    main_drivers = Column(JSON, default=list)            # [{ "dimension": "product", "value": "Product A", "impact_pct": -42.0 }]
    data_source = Column(String(255), default="Sales Database (PostgreSQL)")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="insights")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    rationale = Column(Text, nullable=False)
    target_dimension = Column(String(100), nullable=True)
    estimated_impact_amount = Column(Float, default=0.0)
    estimated_impact_pct = Column(Float, default=0.0)
    confidence = Column(Float, default=0.85)
    priority = Column(String(20), default="P1 - High")
    difficulty = Column(String(20), default="Medium")
    action_steps = Column(JSON, default=list)
    status = Column(String(30), default="pending_approval")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="recommendations")

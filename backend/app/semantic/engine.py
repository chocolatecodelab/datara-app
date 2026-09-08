from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.semantic import SemanticMetric
from app.models.memory import AgentMemory


class SemanticEngine:
    """
    Semantic Layer Engine — Single Source of Truth for Business Metrics & Dimensions.
    Bridges natural language terms to deterministic SQL formulas and business rules.
    """

    @staticmethod
    def lookup_metric(
        term: str, org_id: str, db: Session
    ) -> Optional[Tuple[SemanticMetric, float]]:
        """
        Lookup metric by name or synonym/business_terms.
        Returns (SemanticMetric, confidence_score) or None.
        """
        clean_term = term.strip().lower()
        metrics = db.query(SemanticMetric).filter(
            SemanticMetric.organization_id == org_id
        ).all()

        # 1. Exact metric name match
        for m in metrics:
            if m.name.lower() == clean_term:
                return m, 1.0

        # 2. Exact synonym match in business_terms
        for m in metrics:
            if m.business_terms:
                for b_term in m.business_terms:
                    if b_term.lower() == clean_term:
                        return m, 0.95

        # 3. Partial substring match in name or synonyms
        for m in metrics:
            if clean_term in m.name.lower():
                return m, 0.85
            if m.business_terms:
                for b_term in m.business_terms:
                    if clean_term in b_term.lower() or b_term.lower() in clean_term:
                        return m, 0.80

        return None

    @staticmethod
    def list_metrics(org_id: str, db: Session) -> List[SemanticMetric]:
        """List all defined metrics for an organization."""
        return db.query(SemanticMetric).filter(
            SemanticMetric.organization_id == org_id
        ).all()

    @staticmethod
    def is_dimension_allowed(
        metric: SemanticMetric, dimension: str
    ) -> bool:
        """Check if dimension is allowed for drill-down on this metric."""
        if not metric.allowed_dimensions:
            return True
        clean_dim = dimension.strip().lower()
        return any(d.lower() == clean_dim for d in metric.allowed_dimensions)

    @staticmethod
    def get_semantic_context(org_id: str, db: Session) -> str:
        """
        Builds a comprehensive semantic context string to inject into LLM system prompt.
        Includes metrics, formulas, allowed dimensions, business rules, and agent memories.
        """
        metrics = SemanticEngine.list_metrics(org_id, db)
        memories = db.query(AgentMemory).filter(AgentMemory.organization_id == org_id).all()

        lines = ["# SEMANTIC LAYER (OFFICIAL BUSINESS DEFINITIONS)"]
        if not metrics:
            lines.append("No semantic metrics currently configured.")
        else:
            for m in metrics:
                lines.append(f"\n- Metric: {m.name}")
                lines.append(f"  Source Table: {m.source_table}")
                lines.append(f"  Formula: {m.formula}")
                lines.append(f"  Allowed Dimensions: {', '.join(m.allowed_dimensions) if m.allowed_dimensions else 'All'}")
                lines.append(f"  Synonyms / Terms: {', '.join(m.business_terms) if m.business_terms else '-'}")
                if m.business_rules:
                    lines.append(f"  Business Rules: {m.business_rules}")

        if memories:
            lines.append("\n# AGENT MEMORY (ORGANIZATION BUSINESS INSTRUCTIONS)")
            for mem in memories:
                lines.append(f"- [{mem.category}] {mem.instruction_text}")

        return "\n".join(lines)

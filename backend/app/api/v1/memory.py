from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.memory import AgentMemory
from app.models.organization import Organization
from app.schemas.memory import MemoryCreate, MemoryResponse

router = APIRouter()


def get_default_org_id(db: Session) -> str:
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Default Organization")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.id


@router.get("", response_model=List[MemoryResponse])
def list_memories(
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    target_org_id = org_id or get_default_org_id(db)
    return db.query(AgentMemory).filter(AgentMemory.organization_id == target_org_id).all()


@router.post("", response_model=MemoryResponse, status_code=201)
def add_memory(
    payload: MemoryCreate,
    db: Session = Depends(get_db),
):
    target_org_id = payload.organization_id or get_default_org_id(db)
    mem = AgentMemory(
        organization_id=target_org_id,
        instruction_text=payload.instruction_text,
        category=payload.category or "business_rule",
        added_by=payload.added_by or "user",
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem


@router.delete("/{memory_id}", status_code=204)
def delete_memory(
    memory_id: str,
    db: Session = Depends(get_db),
):
    mem = db.query(AgentMemory).filter(AgentMemory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory instruction not found.")
    db.delete(mem)
    db.commit()
    return None

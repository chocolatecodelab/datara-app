from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.rbac import Role
from app.models.organization import Organization
from app.schemas.rbac import RoleCreate, RoleResponse

router = APIRouter()


def get_default_org_id(db: Session) -> str:
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Default Organization")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.id


@router.get("", response_model=List[RoleResponse])
def list_roles(
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    target_org_id = org_id or get_default_org_id(db)
    return db.query(Role).filter(Role.organization_id == target_org_id).all()


@router.post("", response_model=RoleResponse, status_code=201)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
):
    target_org_id = payload.organization_id or get_default_org_id(db)
    role = Role(
        organization_id=target_org_id,
        name=payload.name,
        allowed_datasets=payload.allowed_datasets,
        restricted_fields=payload.restricted_fields,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=204)
def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    db.delete(role)
    db.commit()
    return None

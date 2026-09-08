from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class RoleBase(BaseModel):
    name: str
    allowed_datasets: List[str] = []
    restricted_fields: List[str] = []


class RoleCreate(RoleBase):
    organization_id: Optional[str] = None


class RoleResponse(RoleBase):
    id: str
    organization_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

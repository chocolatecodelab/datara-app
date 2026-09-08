from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MemoryBase(BaseModel):
    instruction_text: str
    category: Optional[str] = "business_rule"
    added_by: Optional[str] = "user"


class MemoryCreate(MemoryBase):
    organization_id: Optional[str] = None


class MemoryResponse(MemoryBase):
    id: str
    organization_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

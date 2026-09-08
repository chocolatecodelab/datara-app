from datetime import datetime
from pydantic import BaseModel, ConfigDict


class OrganizationBase(BaseModel):
    name: str


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(OrganizationBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

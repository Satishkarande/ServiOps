from datetime import datetime

from pydantic import BaseModel


class SubDepartmentCreate(BaseModel):
    department_id: int
    name: str
    description: str | None = None


class SubDepartmentUpdate(BaseModel):
    department_id: int | None = None
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class SubDepartmentResponse(BaseModel):
    id: int
    department_id: int
    name: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
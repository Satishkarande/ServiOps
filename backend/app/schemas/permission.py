from pydantic import BaseModel


class PermissionCreate(BaseModel):
    name: str
    description: str | None = None


class PermissionUpdate(BaseModel):
    description: str | None = None
    is_active: bool | None = None


class PermissionResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_active: bool
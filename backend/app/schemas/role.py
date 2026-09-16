from pydantic import BaseModel


class RoleCreate(BaseModel):
    name: str
    description: str | None = None


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_active: bool


class RolePermissionResponse(BaseModel):
    role_id: int
    role_name: str
    permission_id: int
    permission_name: str


class RolePermissionUpdate(BaseModel):
    permission_id: int
from datetime import datetime

from pydantic import BaseModel, Field


class UserCreate(BaseModel):

    employee_code: str

    first_name: str

    last_name: str

    email: str

    department_id: int

    sub_department_id: int | None = None

    manager_id: int | None = None

    role_id: int

    password: str = Field(min_length=8)


class UserUpdate(BaseModel):

    first_name: str | None = None

    last_name: str | None = None

    email: str | None = None

    department_id: int | None = None

    sub_department_id: int | None = None

    manager_id: int | None = None

    role_id: int | None = None

    cognito_user_id: str | None = None

    is_active: bool | None = None


class UsernameUpdate(BaseModel):

    username: str = Field(
        min_length=3,
        max_length=50,
        pattern=r"^[A-Za-z0-9._-]+$",
    )


class UserResponse(BaseModel):

    id: int

    employee_code: str

    username: str

    first_name: str

    last_name: str

    email: str

    department_id: int

    sub_department_id: int | None = None

    manager_id: int | None = None

    role_id: int

    cognito_user_id: str | None = None

    is_active: bool

    created_at: datetime

    updated_at: datetime

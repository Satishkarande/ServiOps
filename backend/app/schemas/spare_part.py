from datetime import datetime

from pydantic import BaseModel, Field


# ============================================================
# CREATE SPARE PART
# ============================================================

class SparePartCreate(BaseModel):

    part_code: str = Field(
        min_length=1,
        max_length=50
    )

    name: str = Field(
        min_length=1,
        max_length=200
    )

    description: str | None = None

    manufacturer: str | None = Field(
        default=None,
        max_length=150
    )

    category: str | None = Field(
        default=None,
        max_length=100
    )

    unit: str = Field(
        default="PCS",
        max_length=30
    )

    minimum_stock: int = Field(
        default=0,
        ge=0
    )


# ============================================================
# UPDATE SPARE PART
# ============================================================

class SparePartUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200
    )

    description: str | None = None

    manufacturer: str | None = Field(
        default=None,
        max_length=150
    )

    category: str | None = Field(
        default=None,
        max_length=100
    )

    unit: str | None = Field(
        default=None,
        max_length=30
    )

    minimum_stock: int | None = Field(
        default=None,
        ge=0
    )

    is_active: bool | None = None


# ============================================================
# SPARE PART RESPONSE
# ============================================================

class SparePartResponse(BaseModel):

    id: int

    part_code: str

    name: str

    description: str | None = None

    manufacturer: str | None = None

    category: str | None = None

    unit: str

    minimum_stock: int

    is_active: bool

    created_at: datetime

    updated_at: datetime
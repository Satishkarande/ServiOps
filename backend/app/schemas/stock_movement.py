from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class StockMovementType(str, Enum):

    RECEIPT = "RECEIPT"

    ISSUE = "ISSUE"

    ADJUSTMENT_IN = "ADJUSTMENT_IN"

    ADJUSTMENT_OUT = "ADJUSTMENT_OUT"


    @property
    def quantity_delta(self) -> int:

        if self in {
            self.RECEIPT,
            self.ADJUSTMENT_IN,
        }:

            return 1

        return -1


class StockMovementCreate(BaseModel):

    spare_part_id: int = Field(
        gt=0
    )

    movement_type: StockMovementType

    quantity: int = Field(
        gt=0
    )

    location: str = Field(
        default="MAIN",
        min_length=1,
        max_length=100,
    )

    reference: str | None = Field(
        default=None,
        max_length=100,
    )

    notes: str | None = None


class StockMovementResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )


    id: int

    spare_part_id: int

    movement_type: StockMovementType

    quantity: int

    location: str

    reference: str | None = None

    notes: str | None = None

    created_by_id: int

    created_by_name: str | None = None

    created_at: datetime
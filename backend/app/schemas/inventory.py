from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    spare_part_id: int
    location: str
    quantity: int
    created_at: datetime
    updated_at: datetime


class LowStockResponse(BaseModel):
    spare_part_id: int
    part_code: str
    part_name: str
    minimum_stock: int
    available_quantity: int = Field(ge=0)

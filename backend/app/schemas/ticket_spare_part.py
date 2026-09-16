from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TicketSparePartCreate(BaseModel):
    spare_part_id: int = Field(gt=0)
    location: str = Field(min_length=1, max_length=100)
    quantity: int = Field(gt=0)
    notes: str | None = None


class TicketSparePartSparePartSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    part_code: str
    name: str
    unit: str


class TicketSparePartUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_code: str
    first_name: str
    last_name: str


class TicketSparePartStockMovementSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    movement_type: str
    quantity: int
    location: str
    created_at: datetime


class TicketSparePartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: int
    spare_part_id: int
    location: str
    quantity: int
    stock_movement_id: int
    created_by_id: int
    notes: str | None = None
    created_at: datetime
    spare_part: TicketSparePartSparePartSummary
    created_by: TicketSparePartUserSummary
    stock_movement: TicketSparePartStockMovementSummary

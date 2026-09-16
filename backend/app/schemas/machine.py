from datetime import date, datetime

from pydantic import BaseModel


class MachineCreate(BaseModel):
    plant_id: int
    machine_code: str
    name: str
    model: str | None = None
    serial_number: str
    manufacturer: str | None = None
    installation_date: date | None = None
    status: str = "ACTIVE"
    warranty_expiry: date | None = None


class MachineUpdate(BaseModel):

    plant_id: int | None = None

    name: str | None = None

    model: str | None = None

    manufacturer: str | None = None

    installation_date: date | None = None

    status: str | None = None

    warranty_expiry: date | None = None

    is_active: bool | None = None

class MachineResponse(BaseModel):
    id: int
    plant_id: int
    machine_code: str
    name: str
    model: str | None = None
    serial_number: str
    manufacturer: str | None = None
    installation_date: date | None = None
    status: str
    warranty_expiry: date | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

# ============================================================
# MACHINE OPERATIONAL DETAILS
# ============================================================

class MachineCustomerSummary(BaseModel):
    id: int
    customer_code: str
    name: str


class MachinePlantSummary(BaseModel):
    id: int
    plant_code: str
    name: str


class MachineOperationalDetailsResponse(BaseModel):
    machine: MachineResponse
    customer: MachineCustomerSummary
    plant: MachinePlantSummary
    service_history: list
    spare_parts_used: list
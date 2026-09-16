from datetime import datetime

from pydantic import BaseModel


class PlantCreate(BaseModel):
    customer_id: int
    plant_code: str
    name: str
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None


class PlantUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    is_active: bool | None = None


class PlantResponse(BaseModel):
    id: int
    customer_id: int
    plant_code: str
    name: str
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

class PlantCustomerSummary(BaseModel):

    id: int

    customer_code: str

    name: str


class PlantOperationalDetailsResponse(BaseModel):

    plant: PlantResponse

    customer: PlantCustomerSummary

    machines: list

    service_history: list

    spare_parts_used: list
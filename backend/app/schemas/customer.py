from pydantic import BaseModel

from pydantic import BaseModel


class CustomerCreate(BaseModel):
    customer_code: str
    name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None

class CustomerUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    is_active: bool | None = None

class CustomerResponse(BaseModel):
    id: int
    customer_code: str
    name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    is_active: bool
    
class CustomerOperationalDetailsResponse(BaseModel):

    customer: CustomerResponse

    plants: list

    machines: list

    service_history: list

    spare_parts_used: list
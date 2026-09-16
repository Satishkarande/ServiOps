from datetime import datetime

from pydantic import BaseModel


# ============================================================
# USER SUMMARY
# ============================================================

class TicketUserSummary(BaseModel):

    id: int

    employee_code: str

    first_name: str

    last_name: str

    email: str

    role: str | None = None


# ============================================================
# CUSTOMER SUMMARY
# ============================================================

class TicketCustomerSummary(BaseModel):

    id: int

    customer_code: str

    name: str


# ============================================================
# PLANT SUMMARY
# ============================================================

class TicketPlantSummary(BaseModel):

    id: int

    plant_code: str

    name: str


# ============================================================
# MACHINE SUMMARY
# ============================================================

class TicketMachineSummary(BaseModel):

    id: int

    machine_code: str

    name: str

    model: str | None = None

    serial_number: str | None = None

    manufacturer: str | None = None

    status: str | None = None

# ============================================================
# DEPARTMENT SUMMARY
# ============================================================

class TicketDepartmentSummary(BaseModel):

    id: int

    name: str


# ============================================================
# SUB DEPARTMENT SUMMARY
# ============================================================

class TicketSubDepartmentSummary(BaseModel):

    id: int

    name: str



# ============================================================
# CREATE TICKET
# ============================================================

class ServiceTicketCreate(BaseModel):
    ticket_number: str
    customer_id: int
    plant_id: int
    machine_id: int

    department_id: int
    sub_department_id: int

    created_by_id: int
    assigned_to_id: int | None = None

    title: str
    description: str
    priority: str = "MEDIUM"
    status: str = "OPEN"


# ============================================================
# UPDATE TICKET
# ============================================================

class ServiceTicketUpdate(BaseModel):
    department_id: int | None = None
    sub_department_id: int | None = None

    assigned_to_id: int | None = None

    title: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    resolution: str | None = None
    closed_at: datetime | None = None

# ============================================================
# BASIC TICKET RESPONSE
#
# IMPORTANT:
# assigned_to is included here so the ticket LIST endpoint
# can provide the engineer's name to every authorized viewer.
#
# This does NOT grant assignment permission.
# It only provides display information.
# ============================================================

class ServiceTicketResponse(BaseModel):
    id: int
    ticket_number: str

    customer_id: int
    plant_id: int
    machine_id: int

    department_id: int | None = None
    sub_department_id: int | None = None

    department: TicketDepartmentSummary | None = None
    sub_department: TicketSubDepartmentSummary | None = None

    created_by_id: int
    assigned_to_id: int | None = None

    assigned_to: TicketUserSummary | None = None

    close_requested_by_id: int | None = None

    title: str
    description: str
    priority: str
    status: str
    resolution: str | None = None

    close_requested_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None


# ============================================================
# DETAILED TICKET RESPONSE
# ============================================================
# ============================================================
# DETAILED TICKET RESPONSE
# ============================================================

class ServiceTicketDetailResponse(
    ServiceTicketResponse
):

    customer: TicketCustomerSummary

    plant: TicketPlantSummary

    machine: TicketMachineSummary

    created_by: TicketUserSummary

    close_requested_by: TicketUserSummary | None = None


# ============================================================
# PAGINATED TICKET LIST RESPONSE
# ============================================================

class PaginatedServiceTicketsResponse(BaseModel):

    items: list[ServiceTicketResponse]

    total: int

    page: int

    limit: int

    pages: int

from datetime import datetime

from pydantic import BaseModel


class TicketHistoryUserSummary(BaseModel):

    id: int

    employee_code: str

    first_name: str

    last_name: str

    email: str

    role: str | None = None


class TicketHistoryResponse(BaseModel):

    id: int

    ticket_id: int

    changed_by_id: int

    action: str

    field_name: str | None = None

    old_value: str | None = None

    new_value: str | None = None

    description: str | None = None

    created_at: datetime

    # Full user information for the audit trail.
    # This prevents the UI from having to display
    # "User #8" when the actor is known.
    changed_by: TicketHistoryUserSummary | None = None

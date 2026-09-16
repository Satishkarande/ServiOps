from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.ticket_comment_attachment import TicketCommentAttachmentResponse


class TicketCommentCreate(BaseModel):
    comment: str


class TicketCommentUpdate(BaseModel):
    comment: str


class TicketCommentUserSummary(BaseModel):
    id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    role: str | None = None


class TicketCommentResponse(BaseModel):
    id: int
    ticket_id: int
    comment: str
    created_by: TicketCommentUserSummary
    created_at: datetime
    updated_at: datetime
    attachments: list[TicketCommentAttachmentResponse] = Field(default_factory=list)

    model_config = ConfigDict(
        from_attributes=True
    )

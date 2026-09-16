from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TicketCommentAttachmentResponse(BaseModel):
    id: int
    comment_id: int
    uploaded_by_id: int
    file_name: str
    content_type: str
    file_size: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

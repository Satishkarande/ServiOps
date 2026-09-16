from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TicketCommentAttachment(Base):
    __tablename__ = "ticket_comment_attachments"

    id: Mapped[int] = mapped_column(primary_key=True)

    comment_id: Mapped[int] = mapped_column(
        ForeignKey("ticket_comments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    uploaded_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    comment = relationship(
        "TicketComment",
        back_populates="attachments",
    )

    uploaded_by = relationship(
        "User",
        foreign_keys=[uploaded_by_id],
    )

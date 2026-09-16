from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("service_tickets.id"),
        nullable=False
    )

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    comment: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    ticket = relationship(
        "ServiceTicket",
        back_populates="comments"
    )

    created_by = relationship(
        "User",
        foreign_keys=[created_by_id]
    )

    mentions = relationship(
        "TicketCommentMention",
        back_populates="comment",
        cascade="all, delete-orphan",
    )

    attachments = relationship(
        "TicketCommentAttachment",
        back_populates="comment",
        cascade="all, delete-orphan",
    )

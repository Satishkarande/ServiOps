from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TicketCommentMention(Base):
    __tablename__ = "ticket_comment_mentions"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    comment_id: Mapped[int] = mapped_column(
        ForeignKey(
            "ticket_comments.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    mentioned_user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    comment = relationship(
        "TicketComment",
        back_populates="mentions",
    )

    mentioned_user = relationship(
        "User",
        foreign_keys=[mentioned_user_id],
    )

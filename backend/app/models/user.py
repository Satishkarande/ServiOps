from datetime import datetime

from app.models.role import Role
from app.models.permission import Permission
from app.models.ticket_comment import TicketComment
from app.models.ticket_comment_mentions import TicketCommentMention
from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    employee_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id"),
        nullable=False,
    )

    sub_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("sub_departments.id"),
        nullable=True,
    )

    manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id"),
        nullable=False,
    )

    cognito_user_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    role: Mapped["Role"] = relationship("Role")

    sub_department = relationship("SubDepartment")

    manager = relationship(
        "User",
        remote_side=[id],
        foreign_keys=[manager_id],
    )

    ticket_comments = relationship(
        "TicketComment",
        foreign_keys="TicketComment.created_by_id",
    )

    mentioned_in_comments = relationship(
        "TicketCommentMention",
        foreign_keys="TicketCommentMention.mentioned_user_id",
    )

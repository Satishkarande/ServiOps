from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TicketSparePart(Base):
    __tablename__ = "ticket_spare_parts"

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_ticket_spare_parts_quantity_positive",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("service_tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    spare_part_id: Mapped[int] = mapped_column(
        ForeignKey("spare_parts.id"),
        nullable=False,
        index=True,
    )

    location: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    stock_movement_id: Mapped[int] = mapped_column(
        ForeignKey("stock_movements.id"),
        nullable=False,
        unique=True,
    )

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    ticket = relationship(
        "ServiceTicket",
        back_populates="spare_parts_used",
    )

    spare_part = relationship("SparePart")

    stock_movement = relationship("StockMovement")

    created_by = relationship("User")
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_stock_movements_quantity_positive",
        ),
        CheckConstraint(
            "movement_type IN ('RECEIPT', 'ISSUE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT')",
            name="ck_stock_movements_type",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    spare_part_id: Mapped[int] = mapped_column(
        ForeignKey(
            "spare_parts.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    movement_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    location: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="MAIN"
    )

    reference: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id"
        ),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    spare_part = relationship(
        "SparePart",
        back_populates="stock_movements"
    )

    created_by = relationship(
        "User"
    )

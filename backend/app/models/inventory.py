from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Inventory(Base):
    __tablename__ = "inventory"

    __table_args__ = (
        UniqueConstraint(
            "spare_part_id",
            "location",
            name="uq_inventory_spare_part_location",
        ),
        CheckConstraint(
            "quantity >= 0",
            name="ck_inventory_quantity_non_negative",
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

    location: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="MAIN"
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
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

    spare_part = relationship(
        "SparePart",
        back_populates="inventory"
    )

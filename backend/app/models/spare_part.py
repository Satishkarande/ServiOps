from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SparePart(Base):
    __tablename__ = "spare_parts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    part_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    manufacturer: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    unit: Mapped[str] = mapped_column(
        String(30),
        default="PCS",
        nullable=False
    )

    minimum_stock: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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

    inventory = relationship(
        "Inventory",
        back_populates="spare_part",
        cascade="all, delete-orphan"
    )

    stock_movements = relationship(
        "StockMovement",
        back_populates="spare_part"
    )
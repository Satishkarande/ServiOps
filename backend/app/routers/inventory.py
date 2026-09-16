from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.inventory import Inventory
from app.models.spare_part import SparePart
from app.schemas.inventory import InventoryResponse, LowStockResponse


router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/", response_model=list[InventoryResponse])
def get_inventory(
    spare_part_id: int | None = None,
    location: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("view_inventory")),
):
    query = db.query(Inventory).join(SparePart).filter(SparePart.is_active.is_(True))

    if spare_part_id is not None:
        query = query.filter(Inventory.spare_part_id == spare_part_id)
    if location is not None:
        query = query.filter(Inventory.location == location.strip().upper())

    return query.order_by(Inventory.spare_part_id, Inventory.location).all()


@router.get("/low-stock", response_model=list[LowStockResponse])
def get_low_stock(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("view_inventory")),
):
    available_quantity = func.coalesce(func.sum(Inventory.quantity), 0)
    rows = (
        db.query(
            SparePart.id,
            SparePart.part_code,
            SparePart.name,
            SparePart.minimum_stock,
            available_quantity.label("available_quantity"),
        )
        .outerjoin(Inventory, Inventory.spare_part_id == SparePart.id)
        .filter(SparePart.is_active.is_(True))
        .group_by(SparePart.id)
        .having(available_quantity <= SparePart.minimum_stock)
        .order_by(SparePart.part_code)
        .all()
    )

    return [
        LowStockResponse(
            spare_part_id=row.id,
            part_code=row.part_code,
            part_name=row.name,
            minimum_stock=row.minimum_stock,
            available_quantity=row.available_quantity,
        )
        for row in rows
    ]

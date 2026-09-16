from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.spare_part import SparePart
from app.models.stock_movement import StockMovement
from app.schemas.stock_movement import StockMovementType


def normalise_location(location: str) -> str:
    return location.strip().upper()


def create_stock_movement_in_transaction(
    db: Session, *, spare_part: SparePart, movement_type: StockMovementType,
    quantity: int, location: str, created_by_id: int, reference: str | None = None,
    notes: str | None = None,
) -> StockMovement:
    location = normalise_location(location)
    inventory = (db.query(Inventory).filter(Inventory.spare_part_id == spare_part.id, Inventory.location == location).with_for_update().one_or_none())
    delta = movement_type.quantity_delta * quantity
    if inventory is None:
        if delta < 0:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Insufficient stock for this movement")
        inventory = Inventory(spare_part_id=spare_part.id, location=location, quantity=0)
        db.add(inventory)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            inventory = (db.query(Inventory).filter(Inventory.spare_part_id == spare_part.id, Inventory.location == location).with_for_update().one_or_none())
            if inventory is None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Inventory balance changed concurrently; retry the request")
    if inventory.quantity + delta < 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Insufficient stock for this movement")
    inventory.quantity += delta
    movement = StockMovement(spare_part_id=spare_part.id, movement_type=movement_type.value, quantity=quantity, location=location, reference=reference.strip() if reference else None, notes=notes.strip() if notes else None, created_by_id=created_by_id)
    db.add(movement)
    db.flush()
    return movement

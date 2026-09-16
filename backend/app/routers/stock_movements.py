from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.spare_part import SparePart
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.services.inventory_service import (
    create_stock_movement_in_transaction,
    normalise_location,
)
from app.schemas.stock_movement import (
    StockMovementCreate,
    StockMovementResponse,
)


router = APIRouter(
    prefix="/stock-movements",
    tags=["Stock Movements"],
)


def _movement_response(
    movement: StockMovement,
    user: User | None,
) -> dict:

    if user:

        full_name = (
            f"{user.first_name or ''} "
            f"{user.last_name or ''}"
        ).strip()

        created_by_name = (
            f"{user.employee_code} - {full_name}"
            if user.employee_code and full_name
            else full_name
            or user.employee_code
        )

    else:

        created_by_name = None


    return {

        "id":
            movement.id,

        "spare_part_id":
            movement.spare_part_id,

        "movement_type":
            movement.movement_type,

        "quantity":
            movement.quantity,

        "location":
            movement.location,

        "reference":
            movement.reference,

        "notes":
            movement.notes,

        "created_by_id":
            movement.created_by_id,

        "created_by_name":
            created_by_name,

        "created_at":
            movement.created_at,

    }


@router.get(
    "/",
    response_model=list[StockMovementResponse],
)
def get_stock_movements(
    spare_part_id: int | None = None,
    location: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "view_stock_movement"
        )
    ),
):

    query = (
        db.query(
            StockMovement,
            User,
        )
        .outerjoin(
            User,
            User.id ==
            StockMovement.created_by_id,
        )
    )


    if spare_part_id is not None:

        query = query.filter(
            StockMovement.spare_part_id ==
            spare_part_id
        )


    if location is not None:

        query = query.filter(
            StockMovement.location ==
            normalise_location(
                location
            )
        )


    rows = (
        query
        .order_by(
            StockMovement.created_at.desc(),
            StockMovement.id.desc(),
        )
        .all()
    )


    return [
        _movement_response(
            movement,
            user,
        )
        for movement, user in rows
    ]


@router.post(
    "/",
    response_model=StockMovementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_stock_movement(
    movement_data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "manage_inventory"
        )
    ),
):

    spare_part = (
        db.query(SparePart)
        .filter(
            SparePart.id ==
            movement_data.spare_part_id,

            SparePart.is_active.is_(
                True
            ),
        )
        .one_or_none()
    )


    if spare_part is None:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Spare part not found",
        )


    try:

        movement = create_stock_movement_in_transaction(
            db,
            spare_part=spare_part,
            movement_type=movement_data.movement_type,
            quantity=movement_data.quantity,
            location=movement_data.location,
            created_by_id=current_user.id,
            reference=movement_data.reference,
            notes=movement_data.notes,
        )

        db.commit()

        db.refresh(
            movement
        )

    except HTTPException:

        db.rollback()

        raise

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                "Inventory balance changed concurrently; retry the request",
        )


    user = (
        db.query(User)
        .filter(
            User.id ==
            movement.created_by_id
        )
        .one_or_none()
    )


    return _movement_response(
        movement,
        user,
    )
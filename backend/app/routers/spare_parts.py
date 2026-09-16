from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.spare_part import SparePart
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement
from app.schemas.spare_part import (
    SparePartCreate,
    SparePartResponse,
    SparePartUpdate,
)


router = APIRouter(
    prefix="/spare-parts",
    tags=["Spare Parts"]
)


# ============================================================
# GET ALL SPARE PARTS
# ============================================================

@router.get(
    "/",
    response_model=list[SparePartResponse]
)
def get_spare_parts(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_spare")
    )
):

    return (
        db.query(SparePart)
        .filter(
            SparePart.is_active.is_(True)
        )
        .order_by(
            SparePart.id
        )
        .all()
    )


# ============================================================
# GET ONE SPARE PART
# ============================================================

@router.get(
    "/{spare_part_id}",
    response_model=SparePartResponse
)
def get_spare_part(
    spare_part_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_spare")
    )
):

    spare_part = (
        db.query(SparePart)
        .filter(
            SparePart.id == spare_part_id,
            SparePart.is_active.is_(True)
        )
        .first()
    )


    if spare_part is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spare part not found"
        )


    return spare_part


# ============================================================
# CREATE SPARE PART
# ============================================================

@router.post(
    "/",
    response_model=SparePartResponse,
    status_code=status.HTTP_201_CREATED
)
def create_spare_part(
    spare_part_data: SparePartCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("create_spare")
    )
):

    existing_part = (
        db.query(SparePart)
        .filter(
            SparePart.part_code ==
            spare_part_data.part_code
        )
        .first()
    )


    if existing_part:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Spare part code already exists"
        )


    new_spare_part = SparePart(

        part_code=
            spare_part_data.part_code.strip(),

        name=
            spare_part_data.name.strip(),

        description=
            spare_part_data.description,

        manufacturer=
            spare_part_data.manufacturer,

        category=
            spare_part_data.category,

        unit=
            spare_part_data.unit.strip().upper(),

        minimum_stock=
            spare_part_data.minimum_stock,

        is_active=True,

    )


    db.add(
        new_spare_part
    )


    try:

        db.commit()

        db.refresh(
            new_spare_part
        )

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Spare part code already exists"
        )


    return new_spare_part


# ============================================================
# UPDATE SPARE PART
# ============================================================

@router.patch(
    "/{spare_part_id}",
    response_model=SparePartResponse
)
def update_spare_part(
    spare_part_id: int,
    spare_part_data: SparePartUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("update_spare")
    )
):

    spare_part = (
        db.query(SparePart)
        .filter(
            SparePart.id == spare_part_id
        )
        .first()
    )


    if spare_part is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spare part not found"
        )


    update_data = (
        spare_part_data.model_dump(
            exclude_unset=True
        )
    )


    for field, value in update_data.items():

        if isinstance(
            value,
            str
        ):

            value = value.strip()


        if field == "unit" and value:

            value = value.upper()


        setattr(
            spare_part,
            field,
            value
        )


    db.commit()

    db.refresh(
        spare_part
    )


    return spare_part


# ============================================================
# DEACTIVATE SPARE PART
# ============================================================

@router.delete(
    "/{spare_part_id}",
    response_model=SparePartResponse
)
def deactivate_spare_part(
    spare_part_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("deactivate_spare")
    )
):

    spare_part = (
        db.query(SparePart)
        .filter(
            SparePart.id == spare_part_id
        )
        .first()
    )


    if spare_part is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spare part not found"
        )


    spare_part.is_active = False


    db.commit()

    db.refresh(
        spare_part
    )


    return spare_part
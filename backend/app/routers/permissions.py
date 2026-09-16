from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.permission import Permission
from app.schemas.permission import (
    PermissionCreate,
    PermissionResponse,
    PermissionUpdate,
)


router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"]
)


@router.get(
    "/",
    response_model=list[PermissionResponse]
)
def get_permissions(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_permissions")
    )
):
    return (
        db.query(Permission)
        .order_by(Permission.id)
        .all()
    )


@router.get(
    "/{permission_id}",
    response_model=PermissionResponse
)
def get_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_permissions")
    )
):
    permission = (
        db.query(Permission)
        .filter(Permission.id == permission_id)
        .first()
    )

    if permission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )

    return permission


@router.post(
    "/",
    response_model=PermissionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_permission(
    permission_data: PermissionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_permissions")
    )
):
    permission = Permission(
        name=permission_data.name,
        description=permission_data.description,
        is_active=True,
    )

    db.add(permission)

    try:
        db.commit()
        db.refresh(permission)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission already exists"
        )

    return permission


@router.patch(
    "/{permission_id}",
    response_model=PermissionResponse
)
def update_permission(
    permission_id: int,
    permission_data: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_permissions")
    )
):
    permission = (
        db.query(Permission)
        .filter(Permission.id == permission_id)
        .first()
    )

    if permission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )

    update_data = permission_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(permission, field, value)

    db.commit()
    db.refresh(permission)

    return permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.schemas.role import (
    RoleCreate,
    RolePermissionResponse,
    RolePermissionUpdate,
    RoleResponse,
    RoleUpdate,
)


router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)


@router.get(
    "/",
    response_model=list[RoleResponse]
)
def get_roles(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_roles")
    )
):
    return (
        db.query(Role)
        .order_by(Role.id)
        .all()
    )


@router.get(
    "/{role_id}",
    response_model=RoleResponse
)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_roles")
    )
):
    role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    return role


@router.post(
    "/",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_roles")
    )
):
    role = Role(
        name=role_data.name,
        description=role_data.description,
        is_active=True,
    )

    db.add(role)

    try:
        db.commit()
        db.refresh(role)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role already exists"
        )

    return role


@router.patch(
    "/{role_id}",
    response_model=RoleResponse
)
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_roles")
    )
):
    role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    update_data = role_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(role, field, value)

    try:
        db.commit()
        db.refresh(role)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role name already exists"
        )

    return role


@router.get(
    "/{role_id}/permissions",
    response_model=list[RolePermissionResponse]
)
def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_roles")
    )
):
    role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    results = (
        db.query(
            RolePermission.role_id,
            Role.name.label("role_name"),
            Permission.id.label("permission_id"),
            Permission.name.label("permission_name"),
        )
        .join(
            Role,
            Role.id == RolePermission.role_id
        )
        .join(
            Permission,
            Permission.id == RolePermission.permission_id
        )
        .filter(RolePermission.role_id == role_id)
        .order_by(Permission.id)
        .all()
    )

    return results


@router.post(
    "/{role_id}/permissions",
    response_model=RolePermissionResponse,
    status_code=status.HTTP_201_CREATED
)
def add_permission_to_role(
    role_id: int,
    permission_data: RolePermissionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_roles")
    )
):
    role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    permission = (
        db.query(Permission)
        .filter(
            Permission.id
            == permission_data.permission_id
        )
        .first()
    )

    if permission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )

    existing = (
        db.query(RolePermission)
        .filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id
            == permission_data.permission_id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission is already assigned to this role"
        )

    role_permission = RolePermission(
        role_id=role_id,
        permission_id=permission_data.permission_id,
    )

    db.add(role_permission)
    db.commit()

    return {
        "role_id": role_id,
        "role_name": role.name,
        "permission_id": permission.id,
        "permission_name": permission.name,
    }


@router.delete(
    "/{role_id}/permissions/{permission_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_roles")
    )
):
    role_permission = (
        db.query(RolePermission)
        .filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        .first()
    )

    if role_permission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role permission assignment not found"
        )

    db.delete(role_permission)
    db.commit()

    return None
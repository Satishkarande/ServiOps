from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission
from app.dependencies import get_db
from app.models.department import Department
from app.models.sub_department import SubDepartment
from app.schemas.sub_department import (
    SubDepartmentCreate,
    SubDepartmentResponse,
    SubDepartmentUpdate,
)

router = APIRouter(
    prefix="/sub-departments",
    tags=["Sub Departments"],
)


@router.get(
    "/",
    response_model=list[SubDepartmentResponse],
)
def get_sub_departments(
    department_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = (
        db.query(SubDepartment)
        .filter(SubDepartment.is_active.is_(True))
    )

    if department_id is not None:
        query = query.filter(
            SubDepartment.department_id == department_id
        )

    return query.order_by(SubDepartment.name).all()


@router.get(
    "/{sub_department_id}",
    response_model=SubDepartmentResponse,
)
def get_sub_department(
    sub_department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    sub_department = (
        db.query(SubDepartment)
        .filter(
            SubDepartment.id == sub_department_id,
            SubDepartment.is_active.is_(True),
        )
        .first()
    )

    if sub_department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sub department not found",
        )

    return sub_department


@router.post(
    "/",
    response_model=SubDepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_sub_department(
    sub_department_data: SubDepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("manage_users")),
):
    department = (
        db.query(Department)
        .filter(Department.id == sub_department_data.department_id)
        .first()
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    existing = (
        db.query(SubDepartment)
        .filter(
            SubDepartment.department_id == sub_department_data.department_id,
            SubDepartment.name == sub_department_data.name,
        )
        .first()
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A sub department with this name "
                "already exists in the selected department"
            ),
        )

    sub_department = SubDepartment(
        department_id=sub_department_data.department_id,
        name=sub_department_data.name.strip(),
        description=(
            sub_department_data.description.strip()
            if sub_department_data.description
            else None
        ),
        is_active=True,
    )

    db.add(sub_department)

    try:
        db.commit()
        db.refresh(sub_department)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A sub department with this name "
                "already exists in the selected department"
            ),
        )

    return sub_department


@router.patch(
    "/{sub_department_id}",
    response_model=SubDepartmentResponse,
)
def update_sub_department(
    sub_department_id: int,
    sub_department_data: SubDepartmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("manage_users")),
):
    sub_department = (
        db.query(SubDepartment)
        .filter(SubDepartment.id == sub_department_id)
        .first()
    )

    if sub_department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sub department not found",
        )

    update_data = sub_department_data.model_dump(exclude_unset=True)

    if "department_id" in update_data:
        department = (
            db.query(Department)
            .filter(Department.id == update_data["department_id"])
            .first()
        )

        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

    if "sub_department_id" in update_data:
        pass

    if "name" in update_data or "department_id" in update_data:
        department_id = update_data.get(
            "department_id",
            sub_department.department_id,
        )
        name = update_data.get(
            "name",
            sub_department.name,
        )

        existing = (
            db.query(SubDepartment)
            .filter(
                SubDepartment.department_id == department_id,
                SubDepartment.name == name,
                SubDepartment.id != sub_department.id,
            )
            .first()
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A sub department with this name "
                    "already exists in the selected department"
                ),
            )

    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()

    if "description" in update_data:
        update_data["description"] = (
            update_data["description"].strip()
            if update_data["description"]
            else None
        )

    for field, value in update_data.items():
        setattr(sub_department, field, value)

    try:
        db.commit()
        db.refresh(sub_department)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update sub department",
        )

    return sub_department


@router.delete(
    "/{sub_department_id}",
    response_model=SubDepartmentResponse,
)
def deactivate_sub_department(
    sub_department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("manage_users")),
):
    sub_department = (
        db.query(SubDepartment)
        .filter(SubDepartment.id == sub_department_id)
        .first()
    )

    if sub_department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sub department not found",
        )

    sub_department.is_active = False

    db.commit()
    db.refresh(sub_department)

    return sub_department

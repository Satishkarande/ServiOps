from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.dependencies import get_db
from app.models.department import Department


router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


@router.get("/")
def get_departments(
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user
    )
):
    departments = (
        db.query(Department)
        .order_by(Department.id)
        .all()
    )

    return departments

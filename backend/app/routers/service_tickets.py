from datetime import datetime, timedelta
import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import (
    get_current_user,
    require_permission,
    user_has_permission,
)

from app.dependencies import get_db

from app.models.customer import Customer
from app.models.machine import Machine
from app.models.plant import Plant
from app.models.role import Role
from app.models.service_ticket import ServiceTicket
from app.models.user import User
from app.models.department import Department
from app.models.sub_department import SubDepartment

from app.schemas.service_ticket import (
    PaginatedServiceTicketsResponse,
    ServiceTicketCreate,
    ServiceTicketResponse,
    ServiceTicketUpdate,
    ServiceTicketDetailResponse,
)

from app.services.notification_service import (
    create_notification,
)

from app.services.ticket_history_service import (
    record_ticket_history,
)


router = APIRouter(
    prefix="/tickets",
    tags=["Service Tickets"]
)


# ============================================================
# VALID STATUS VALUES
# ============================================================

VALID_STATUSES = {
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSE_REQUESTED",
    "CLOSED",
    "CANCELLED",
}

MATERIAL_CONSUMPTION_STATUSES = {
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSE_REQUESTED",
}


# ============================================================
# STATUS PERMISSIONS
# ============================================================

STATUS_PERMISSIONS = {

    "OPEN":
        "update_ticket",

    "ASSIGNED":
        "assign_engineer",

    "IN_PROGRESS":
        "start_ticket",

    "RESOLVED":
        "resolve_ticket",

    "CLOSE_REQUESTED":
        "request_close_ticket",

    "CLOSED":
        "close_ticket",

    "CANCELLED":
        "cancel_ticket",
}


# ============================================================
# ROLE HELPER
# ============================================================

def get_user_role_name(
    user: User
) -> str | None:

    if user.role is None:
        return None

    return user.role.name


# ============================================================
# USER SUMMARY HELPER
#
# Used by ticket list/detail responses.
# ============================================================

def build_user_summary(
    user: User | None
):

    if user is None:
        return None

    return {
        "id": user.id,
        "employee_code": user.employee_code,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": (
            user.role.name
            if user.role
            else None
        ),
    }


# ============================================================
# DEPARTMENT SUMMARY HELPER
# ============================================================

def build_department_summary(
    department: Department | None
):

    if department is None:
        return None

    return {
        "id": department.id,
        "name": department.name,
    }


# ============================================================
# SUB-DEPARTMENT SUMMARY HELPER
# ============================================================

def build_sub_department_summary(
    sub_department: SubDepartment | None
):

    if sub_department is None:
        return None

    return {
        "id": sub_department.id,
        "name": sub_department.name,
    }


# ============================================================
# VALIDATE TICKET DEPARTMENT OWNERSHIP
#
# Every new ticket must have:
#
# Department
#      ↓
# Sub Department
#
# The sub-department must belong to the selected department.
# ============================================================

def validate_ticket_ownership(
    db: Session,
    department_id: int,
    sub_department_id: int,
):

    department = (
        db.query(Department)
        .filter(
            Department.id == department_id
        )
        .first()
    )

    if department is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

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
            detail="Sub-department not found or inactive"
        )

    if sub_department.department_id != department.id:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Sub-department does not belong "
                "to the selected department"
            )
        )

    return department, sub_department


# ============================================================
# BUILD STANDARD TICKET RESPONSE
#
# Keeps ticket responses consistent across:
# - Create
# - Update
# - List
# - Detail
# - Cancel
# - Deny closure
#
# Existing tickets may have NULL department ownership because
# ownership was added after those tickets were created.
# ============================================================

def build_ticket_response(
    db: Session,
    ticket: ServiceTicket,
):

    assigned_to = None

    if ticket.assigned_to_id is not None:

        assigned_to = (
            db.query(User)
            .filter(
                User.id == ticket.assigned_to_id
            )
            .first()
        )

    department = None

    if ticket.department_id is not None:

        department = (
            db.query(Department)
            .filter(
                Department.id == ticket.department_id
            )
            .first()
        )

    sub_department = None

    if ticket.sub_department_id is not None:

        sub_department = (
            db.query(SubDepartment)
            .filter(
                SubDepartment.id == ticket.sub_department_id
            )
            .first()
        )

    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,

        "customer_id": ticket.customer_id,
        "plant_id": ticket.plant_id,
        "machine_id": ticket.machine_id,

        "created_by_id": ticket.created_by_id,

        "department_id": ticket.department_id,
        "sub_department_id": ticket.sub_department_id,

        "assigned_to_id": ticket.assigned_to_id,
        "assigned_to": build_user_summary(assigned_to),

        "close_requested_by_id":
            ticket.close_requested_by_id,

        "title": ticket.title,
        "description": ticket.description,
        "priority": ticket.priority,
        "status": ticket.status,
        "resolution": ticket.resolution,

        "close_requested_at":
            ticket.close_requested_at,

        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "closed_at": ticket.closed_at,

        "department":
            build_department_summary(department),

        "sub_department":
            build_sub_department_summary(sub_department),
    }


# ============================================================
# VALIDATE ASSIGNMENT TARGET
#
# Tickets can only be assigned to active Service Engineers.
# ============================================================

def validate_assignment_target(
    current_user: User,
    assigned_user: User
):

    if not assigned_user.is_active:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign ticket to an inactive user"
        )

    current_role = get_user_role_name(
        current_user
    )

    target_role = get_user_role_name(
        assigned_user
    )

    # --------------------------------------------------------
    # Service Engineer
    # --------------------------------------------------------

    if current_role == "Service Engineer":

        if target_role != "Service Engineer":

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Service Engineers can assign tickets "
                    "only to other Service Engineers"
                )
            )

        return

    # --------------------------------------------------------
    # Service Manager
    # --------------------------------------------------------

    if current_role == "Service Manager":

        if target_role != "Service Engineer":

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Service Managers can assign tickets "
                    "only to Service Engineers"
                )
            )

        return

    # --------------------------------------------------------
    # System Administrator
    # --------------------------------------------------------

    if current_role == "System Administrator":

        if target_role != "Service Engineer":

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Tickets can only be assigned to "
                    "Service Engineers"
                )
            )

        return

    # --------------------------------------------------------
    # Service Incharge
    # --------------------------------------------------------

    if current_role == "Service Incharge":

        if target_role != "Service Engineer":

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Tickets can only be assigned to "
                    "Service Engineers"
                )
            )

        return

    # --------------------------------------------------------
    # Everything else
    # --------------------------------------------------------

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "Your role is not allowed to assign "
            "service tickets"
        )
    )


# ============================================================
# GET ASSIGNABLE ENGINEERS
# ============================================================

@router.get(
    "/assignable-engineers"
)
def get_assignable_engineers(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("assign_engineer")
    )
):

    engineers = (
        db.query(User)
        .join(
            Role,
            User.role_id == Role.id
        )
        .filter(
            User.is_active.is_(True),
            Role.name == "Service Engineer",
            Role.is_active.is_(True)
        )
        .order_by(
            User.first_name,
            User.last_name
        )
        .all()
    )

    return [
        {
            "id": user.id,
            "employee_code": user.employee_code,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role.name,
        }
        for user in engineers
    ]


# ============================================================
# GET ALL TICKETS (FILTERED & PAGINATED)
# ============================================================

@router.get(
    "/",
    response_model=PaginatedServiceTicketsResponse
)
def get_tickets(
    customer_id: int | None = None,
    plant_id: int | None = None,
    machine_id: int | None = None,
    department_id: int | None = None,
    sub_department_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    assigned_to: str | None = None,
    active: bool | None = None,
    aging: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("view_ticket")
    )
):

    query = (
        db.query(
            ServiceTicket,
            User
        )
        .outerjoin(
            User,
            User.id ==
            ServiceTicket.assigned_to_id
        )
    )

    if customer_id is not None:
        query = query.filter(
            ServiceTicket.customer_id == customer_id
        )

    if plant_id is not None:
        query = query.filter(
            ServiceTicket.plant_id == plant_id
        )

    if machine_id is not None:
        query = query.filter(
            ServiceTicket.machine_id == machine_id
        )

    if department_id is not None:
        query = query.filter(
            ServiceTicket.department_id == department_id
        )

    if sub_department_id is not None:
        query = query.filter(
            ServiceTicket.sub_department_id == sub_department_id
        )

    if status is not None and status.strip():

        clean_status = status.strip().upper()

        query = query.filter(
            ServiceTicket.status == clean_status
        )

    if priority is not None and priority.strip():

        clean_priority = priority.strip().upper()

        query = query.filter(
            ServiceTicket.priority == clean_priority
        )

    if assigned_to is not None and assigned_to.strip():

        clean_assigned = assigned_to.strip()

        if clean_assigned.lower() == "me":

            query = query.filter(
                ServiceTicket.assigned_to_id ==
                current_user.id
            )

        elif clean_assigned.lower() == "unassigned":

            query = query.filter(
                ServiceTicket.assigned_to_id.is_(None)
            )

        else:

            try:

                assigned_id = int(
                    clean_assigned
                )

                query = query.filter(
                    ServiceTicket.assigned_to_id ==
                    assigned_id
                )

            except ValueError:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Invalid assigned_to parameter. "
                        "Must be an integer ID, 'me', "
                        "or 'unassigned'."
                    ),
                )

    if active is not None:

        if active:

            query = query.filter(
                ServiceTicket.status.notin_(
                    ["CLOSED", "CANCELLED"]
                )
            )

        else:

            query = query.filter(
                ServiceTicket.status.in_(
                    ["CLOSED", "CANCELLED"]
                )
            )

    if aging is not None and aging.strip():

        clean_aging = aging.strip().lower()

        now = datetime.utcnow()

        if clean_aging == "under_1_day":

            query = query.filter(
                ServiceTicket.created_at >=
                now - timedelta(days=1),

                ServiceTicket.status.notin_(
                    ["CLOSED", "CANCELLED"]
                ),
            )

        elif clean_aging == "one_to_three_days":

            query = query.filter(
                ServiceTicket.created_at <
                now - timedelta(days=1),

                ServiceTicket.created_at >=
                now - timedelta(days=3),

                ServiceTicket.status.notin_(
                    ["CLOSED", "CANCELLED"]
                ),
            )

        elif clean_aging == "over_3_days":

            query = query.filter(
                ServiceTicket.created_at <
                now - timedelta(days=3),

                ServiceTicket.status.notin_(
                    ["CLOSED", "CANCELLED"]
                ),
            )

    total = (
        query
        .with_entities(
            func.count(ServiceTicket.id)
        )
        .scalar()
        or 0
    )

    pages = (
        math.ceil(total / limit)
        if total > 0
        else 0
    )

    offset = (
        page - 1
    ) * limit

    results = (
        query
        .order_by(
            ServiceTicket.id
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []

    for ticket, assigned_user in results:

        department = None

        if ticket.department_id is not None:

            department = (
                db.query(Department)
                .filter(
                    Department.id ==
                    ticket.department_id
                )
                .first()
            )

        sub_department = None

        if ticket.sub_department_id is not None:

            sub_department = (
                db.query(SubDepartment)
                .filter(
                    SubDepartment.id ==
                    ticket.sub_department_id
                )
                .first()
            )

        items.append({

            "id":
                ticket.id,

            "ticket_number":
                ticket.ticket_number,

            "customer_id":
                ticket.customer_id,

            "plant_id":
                ticket.plant_id,

            "machine_id":
                ticket.machine_id,

            "created_by_id":
                ticket.created_by_id,

            "department_id":
                ticket.department_id,

            "sub_department_id":
                ticket.sub_department_id,

            "assigned_to_id":
                ticket.assigned_to_id,

            "assigned_to":
                build_user_summary(
                    assigned_user
                ),

            "close_requested_by_id":
                ticket.close_requested_by_id,

            "title":
                ticket.title,

            "description":
                ticket.description,

            "priority":
                ticket.priority,

            "status":
                ticket.status,

            "resolution":
                ticket.resolution,

            "close_requested_at":
                ticket.close_requested_at,

            "created_at":
                ticket.created_at,

            "updated_at":
                ticket.updated_at,

            "closed_at":
                ticket.closed_at,

            "department":
                build_department_summary(
                    department
                ),

            "sub_department":
                build_sub_department_summary(
                    sub_department
                ),
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
    }


# ============================================================
# GET SINGLE TICKET
# ============================================================

@router.get(
    "/{ticket_id}",
    response_model=ServiceTicketDetailResponse
)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_ticket")
    )
):

    ticket = (
        db.query(ServiceTicket)
        .filter(
            ServiceTicket.id == ticket_id
        )
        .first()
    )

    if ticket is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    # --------------------------------------------------------
    # Related records
    # --------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == ticket.customer_id
        )
        .first()
    )

    plant = (
        db.query(Plant)
        .filter(
            Plant.id == ticket.plant_id
        )
        .first()
    )

    machine = (
        db.query(Machine)
        .filter(
            Machine.id == ticket.machine_id
        )
        .first()
    )

    created_by = (
        db.query(User)
        .filter(
            User.id == ticket.created_by_id
        )
        .first()
    )

    assigned_to = None

    if ticket.assigned_to_id is not None:

        assigned_to = (
            db.query(User)
            .filter(
                User.id ==
                ticket.assigned_to_id
            )
            .first()
        )

    close_requested_by = None

    if ticket.close_requested_by_id is not None:

        close_requested_by = (
            db.query(User)
            .filter(
                User.id ==
                ticket.close_requested_by_id
            )
            .first()
        )

    department = None

    if ticket.department_id is not None:

        department = (
            db.query(Department)
            .filter(
                Department.id ==
                ticket.department_id
            )
            .first()
        )

    sub_department = None

    if ticket.sub_department_id is not None:

        sub_department = (
            db.query(SubDepartment)
            .filter(
                SubDepartment.id ==
                ticket.sub_department_id
            )
            .first()
        )

    # --------------------------------------------------------
    # Validate required relationships
    # --------------------------------------------------------

    if customer is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket customer not found"
        )

    if plant is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket plant not found"
        )

    if machine is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket machine not found"
        )

    if created_by is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket creator not found"
        )

    # --------------------------------------------------------
    # Build response
    # --------------------------------------------------------

    response = build_ticket_response(
        db,
        ticket
    )

    response.update({

        "customer": {

            "id":
                customer.id,

            "customer_code":
                customer.customer_code,

            "name":
                customer.name,
        },

        "plant": {

            "id":
                plant.id,

            "plant_code":
                plant.plant_code,

            "name":
                plant.name,
        },

        "machine": {

            "id":
                machine.id,

            "machine_code":
                machine.machine_code,

            "name":
                machine.name,

            "model":
                machine.model,

            "serial_number":
                machine.serial_number,

            "manufacturer":
                machine.manufacturer,

            "status":
                machine.status,
        },

        "created_by":
            build_user_summary(
                created_by
            ),

        "assigned_to":
            build_user_summary(
                assigned_to
            ),

        "close_requested_by":
            build_user_summary(
                close_requested_by
            ),

        "department":
            build_department_summary(
                department
            ),

        "sub_department":
            build_sub_department_summary(
                sub_department
            ),
    })

    return response


# ============================================================
# CREATE TICKET
# ============================================================

@router.post(
    "/",
    response_model=ServiceTicketResponse,
    status_code=status.HTTP_201_CREATED
)
def create_ticket(
    ticket: ServiceTicketCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("create_ticket")
    )
):

    # --------------------------------------------------------
    # Customer
    # --------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.id ==
            ticket.customer_id
        )
        .first()
    )

    if customer is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # --------------------------------------------------------
    # Plant
    # --------------------------------------------------------

    plant = (
        db.query(Plant)
        .filter(
            Plant.id ==
            ticket.plant_id
        )
        .first()
    )

    if plant is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )

    # --------------------------------------------------------
    # Machine
    # --------------------------------------------------------

    machine = (
        db.query(Machine)
        .filter(
            Machine.id ==
            ticket.machine_id
        )
        .first()
    )

    if machine is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found"
        )

    # --------------------------------------------------------
    # Validate hierarchy
    # --------------------------------------------------------

    if plant.customer_id != customer.id:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plant does not belong to customer"
        )

    if machine.plant_id != plant.id:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Machine does not belong to plant"
        )

    # --------------------------------------------------------
    # Department ownership
    # --------------------------------------------------------

    department, sub_department = (
        validate_ticket_ownership(
            db,
            ticket.department_id,
            ticket.sub_department_id,
        )
    )

    # --------------------------------------------------------
    # Creator
    # --------------------------------------------------------

    creator = (
        db.query(User)
        .filter(
            User.id ==
            ticket.created_by_id
        )
        .first()
    )

    if creator is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket creator not found"
        )

    if not creator.is_active:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket creator is inactive"
        )

    # --------------------------------------------------------
    # New tickets always start OPEN
    # --------------------------------------------------------

    if ticket.status != "OPEN":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "New tickets must start "
                "with status OPEN"
            )
        )

    # --------------------------------------------------------
    # Initial assignment
    # --------------------------------------------------------

    assigned_user = None

    if ticket.assigned_to_id is not None:

        if not user_has_permission(
            current_user,
            "assign_engineer"
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Permission required: "
                    "assign_engineer"
                )
            )

        assigned_user = (
            db.query(User)
            .filter(
                User.id ==
                ticket.assigned_to_id
            )
            .first()
        )

        if assigned_user is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )

        validate_assignment_target(
            current_user,
            assigned_user
        )

    # --------------------------------------------------------
    # Create ticket
    # --------------------------------------------------------

    new_ticket = ServiceTicket(

        ticket_number=
            ticket.ticket_number,

        customer_id=
            ticket.customer_id,

        plant_id=
            ticket.plant_id,

        machine_id=
            ticket.machine_id,

        created_by_id=
            ticket.created_by_id,

        department_id=
            department.id,

        sub_department_id=
            sub_department.id,

        assigned_to_id=
            ticket.assigned_to_id,

        title=
            ticket.title,

        description=
            ticket.description,

        priority=
            ticket.priority,

        status=
            "OPEN",
    )

    db.add(
        new_ticket
    )

    try:

        db.flush()

        # ----------------------------------------------------
        # Record ticket creation
        # ----------------------------------------------------

        record_ticket_history(
            db=db,
            ticket_id=new_ticket.id,
            changed_by_id=current_user.id,
            action="CREATED",
            description=(
                f"Ticket "
                f"{new_ticket.ticket_number} "
                "created"
            ),
        )

        # ----------------------------------------------------
        # Record department ownership
        # ----------------------------------------------------

        record_ticket_history(
            db=db,
            ticket_id=new_ticket.id,
            changed_by_id=current_user.id,
            action="DEPARTMENT_ASSIGNED",
            field_name="department_id",
            old_value=None,
            new_value=str(
                department.id
            ),
            description=(
                f"Ticket assigned to department "
                f"{department.name}"
            ),
        )

        record_ticket_history(
            db=db,
            ticket_id=new_ticket.id,
            changed_by_id=current_user.id,
            action="SUB_DEPARTMENT_ASSIGNED",
            field_name="sub_department_id",
            old_value=None,
            new_value=str(
                sub_department.id
            ),
            description=(
                f"Ticket assigned to sub-department "
                f"{sub_department.name}"
            ),
        )

        # ----------------------------------------------------
        # Initial assignment notification
        # ----------------------------------------------------

        if assigned_user is not None:

            record_ticket_history(
                db=db,
                ticket_id=new_ticket.id,
                changed_by_id=current_user.id,
                action="ASSIGNED",
                field_name="assigned_to_id",
                old_value=None,
                new_value=str(
                    assigned_user.id
                ),
                description=(
                    "Ticket assigned to "
                    f"{assigned_user.first_name} "
                    f"{assigned_user.last_name}"
                ),
            )

            create_notification(
                db=db,
                user_id=assigned_user.id,
                notification_type="TICKET_ASSIGNED",
                title="Ticket Assigned",
                message=(
                    f"Ticket "
                    f"{new_ticket.ticket_number} "
                    "has been assigned to you."
                ),
                ticket_id=new_ticket.id,
            )

        db.commit()

        db.refresh(
            new_ticket
        )

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticket number already exists"
        )

    return build_ticket_response(
        db,
        new_ticket
    )


# ============================================================
# UPDATE TICKET
# ============================================================

@router.patch(
    "/{ticket_id}",
    response_model=ServiceTicketResponse
)
def update_ticket(
    ticket_id: int,
    ticket_data: ServiceTicketUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user
    )
):

    # --------------------------------------------------------
    # Find ticket
    # --------------------------------------------------------

    ticket = (
        db.query(ServiceTicket)
        .filter(
            ServiceTicket.id == ticket_id
        )
        .first()
    )

    if ticket is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    update_data = ticket_data.model_dump(
        exclude_unset=True
    )

    if not update_data:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided"
        )

    # ========================================================
    # CAPTURE ORIGINAL VALUES
    # ========================================================

    original_assigned_to_id = (
        ticket.assigned_to_id
    )

    original_department_id = (
        ticket.department_id
    )

    original_sub_department_id = (
        ticket.sub_department_id
    )

    original_status = (
        ticket.status
    )

    original_priority = (
        ticket.priority
    )

    original_title = (
        ticket.title
    )

    original_description = (
        ticket.description
    )

    original_resolution = (
        ticket.resolution
    )

    # ========================================================
    # DEPARTMENT OWNERSHIP
    # ========================================================

    ownership_changed = (
        "department_id" in update_data
        or
        "sub_department_id" in update_data
    )

    if ownership_changed:

        if not user_has_permission(
            current_user,
            "update_ticket"
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Permission required: "
                    "update_ticket"
                )
            )

        effective_department_id = (
            update_data.get(
                "department_id",
                ticket.department_id
            )
        )

        effective_sub_department_id = (
            update_data.get(
                "sub_department_id",
                ticket.sub_department_id
            )
        )

        if (
            effective_department_id is None
            or
            effective_sub_department_id is None
        ):

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Department and sub-department "
                    "are both required"
                )
            )

        department, sub_department = (
            validate_ticket_ownership(
                db,
                effective_department_id,
                effective_sub_department_id,
            )
        )

        update_data["department_id"] = (
            department.id
        )

        update_data["sub_department_id"] = (
            sub_department.id
        )

    # ========================================================
    # NORMAL EDITABLE FIELDS
    # ========================================================

    normal_fields = {
        "title",
        "description",
        "priority",
    }

    normal_field_changed = any(

        field in update_data
        and
        getattr(
            ticket,
            field
        ) != update_data[field]

        for field in normal_fields

    )

    if normal_field_changed:

        if not user_has_permission(
            current_user,
            "update_ticket"
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Permission required: "
                    "update_ticket"
                )
            )

    # ========================================================
    # ASSIGNMENT
    # ========================================================

    assigned_user = None

    previous_assigned_user = None

    assignment_changed = False

    if "assigned_to_id" in update_data:

        new_assigned_id = (
            update_data[
                "assigned_to_id"
            ]
        )

        if (
            new_assigned_id
            !=
            ticket.assigned_to_id
        ):

            assignment_changed = True

            if not user_has_permission(
                current_user,
                "assign_engineer"
            ):

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Permission required: "
                        "assign_engineer"
                    )
                )

            if new_assigned_id is None:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "A ticket must have an "
                        "assigned engineer"
                    )
                )

            assigned_user = (
                db.query(User)
                .filter(
                    User.id ==
                    new_assigned_id
                )
                .first()
            )

            if assigned_user is None:

                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned user not found"
                )

            validate_assignment_target(
                current_user,
                assigned_user
            )

            if ticket.assigned_to_id is not None:

                previous_assigned_user = (
                    db.query(User)
                    .filter(
                        User.id ==
                        ticket.assigned_to_id
                    )
                    .first()
                )

    # ========================================================
    # STATUS
    # ========================================================

    status_changed = False

    new_status = None

    if "status" in update_data:

        new_status = (
            update_data[
                "status"
            ]
        )

        if new_status not in VALID_STATUSES:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ticket status"
            )

        current_status = (
            ticket.status
        )

        if new_status != current_status:

            status_changed = True

            required_permission = (
                STATUS_PERMISSIONS[
                    new_status
                ]
            )

            if not user_has_permission(
                current_user,
                required_permission
            ):

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Permission required: "
                        f"{required_permission}"
                    )
                )

            # ------------------------------------------------
            # ASSIGNED
            # ------------------------------------------------

            if new_status == "ASSIGNED":

                assigned_id = update_data.get(
                    "assigned_to_id",
                    ticket.assigned_to_id
                )

                if assigned_id is None:

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Ticket must have an "
                            "assigned engineer"
                        )
                    )

            # ------------------------------------------------
            # IN PROGRESS
            # ------------------------------------------------

            elif new_status == "IN_PROGRESS":

                assigned_id = update_data.get(
                    "assigned_to_id",
                    ticket.assigned_to_id
                )

                if assigned_id is None:

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Ticket must have an "
                            "assigned engineer "
                            "before starting work"
                        )
                    )

            # ------------------------------------------------
            # RESOLVED
            # ------------------------------------------------

            elif new_status == "RESOLVED":

                resolution = update_data.get(
                    "resolution",
                    ticket.resolution
                )

                if (
                    not resolution
                    or
                    not str(
                        resolution
                    ).strip()
                ):

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Resolution is required "
                            "before resolving a ticket"
                        )
                    )

            # ------------------------------------------------
            # CLOSE REQUESTED
            # ------------------------------------------------

            elif new_status == "CLOSE_REQUESTED":

                resolution = update_data.get(
                    "resolution",
                    ticket.resolution
                )

                if (
                    not resolution
                    or
                    not str(
                        resolution
                    ).strip()
                ):

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Resolution is required "
                            "before requesting "
                            "ticket closure"
                        )
                    )

                update_data[
                    "close_requested_by_id"
                ] = current_user.id

                update_data[
                    "close_requested_at"
                ] = datetime.utcnow()

            # ------------------------------------------------
            # CLOSED
            # ------------------------------------------------

            elif new_status == "CLOSED":

                resolution = update_data.get(
                    "resolution",
                    ticket.resolution
                )

                if (
                    not resolution
                    or
                    not str(
                        resolution
                    ).strip()
                ):

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Resolution is required "
                            "before closing a ticket"
                        )
                    )

                update_data[
                    "closed_at"
                ] = (
                    update_data.get(
                        "closed_at"
                    )
                    or
                    datetime.utcnow()
                )

            # ------------------------------------------------
            # CANCELLED
            # ------------------------------------------------

            elif new_status == "CANCELLED":

                pass

    # ========================================================
    # RESOLUTION
    # ========================================================

    resolution_changed = False

    if "resolution" in update_data:

        new_resolution = update_data[
            "resolution"
        ]

        if (
            new_resolution
            !=
            ticket.resolution
        ):

            resolution_changed = True

            has_resolve_permission = (
                user_has_permission(
                    current_user,
                    "resolve_ticket"
                )
            )

            is_assigned_engineer = (
                ticket.assigned_to_id
                ==
                current_user.id
            )

            has_close_request_permission = (
                user_has_permission(
                    current_user,
                    "request_close_ticket"
                )
            )

            if not (
                has_resolve_permission
                or
                (
                    is_assigned_engineer
                    and
                    has_close_request_permission
                )
            ):

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "You are not allowed to "
                        "update the ticket resolution"
                    )
                )

            if (
                new_resolution is not None
                and
                not str(
                    new_resolution
                ).strip()
            ):

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Resolution cannot be empty"
                    )
                )

    # ========================================================
    # CLOSED_AT
    # ========================================================

    if "closed_at" in update_data:

        new_closed_at = (
            update_data[
                "closed_at"
            ]
        )

        if (
            new_closed_at
            !=
            ticket.closed_at
        ):

            status_is_being_closed = (

                update_data.get(
                    "status"
                )
                ==
                "CLOSED"

                and

                ticket.status
                !=
                "CLOSED"

            )

            if not status_is_being_closed:

                if not user_has_permission(
                    current_user,
                    "close_ticket"
                ):

                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            "Permission required: "
                            "close_ticket"
                        )
                    )

    # ========================================================
    # APPLY CHANGES
    # ========================================================

    allowed_fields = {

        "department_id",

        "sub_department_id",

        "assigned_to_id",

        "title",

        "description",

        "priority",

        "status",

        "resolution",

        "closed_at",

        "close_requested_by_id",

        "close_requested_at",

    }

    for field, value in update_data.items():

        if field in allowed_fields:

            setattr(
                ticket,
                field,
                value
            )

    try:

        # ====================================================
        # DEPARTMENT HISTORY
        # ====================================================

        if (
            ownership_changed
            and
            ticket.department_id
            !=
            original_department_id
        ):

            old_department = None

            if original_department_id is not None:

                old_department = (
                    db.query(Department)
                    .filter(
                        Department.id ==
                        original_department_id
                    )
                    .first()
                )

            new_department = (
                db.query(Department)
                .filter(
                    Department.id ==
                    ticket.department_id
                )
                .first()
            )

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="DEPARTMENT_CHANGED",
                field_name="department_id",
                old_value=(
                    str(
                        original_department_id
                    )
                    if original_department_id
                    is not None
                    else None
                ),
                new_value=(
                    str(
                        ticket.department_id
                    )
                    if ticket.department_id
                    is not None
                    else None
                ),
                description=(
                    "Department changed from "
                    f"{old_department.name if old_department else 'Unassigned'} "
                    "to "
                    f"{new_department.name if new_department else 'Unassigned'}"
                ),
            )

        # ====================================================
        # SUB-DEPARTMENT HISTORY
        # ====================================================

        if (
            ownership_changed
            and
            ticket.sub_department_id
            !=
            original_sub_department_id
        ):

            old_sub_department = None

            if original_sub_department_id is not None:

                old_sub_department = (
                    db.query(SubDepartment)
                    .filter(
                        SubDepartment.id ==
                        original_sub_department_id
                    )
                    .first()
                )

            new_sub_department = (
                db.query(SubDepartment)
                .filter(
                    SubDepartment.id ==
                    ticket.sub_department_id
                )
                .first()
            )

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="SUB_DEPARTMENT_CHANGED",
                field_name="sub_department_id",
                old_value=(
                    str(
                        original_sub_department_id
                    )
                    if original_sub_department_id
                    is not None
                    else None
                ),
                new_value=(
                    str(
                        ticket.sub_department_id
                    )
                    if ticket.sub_department_id
                    is not None
                    else None
                ),
                description=(
                    "Sub-department changed from "
                    f"{old_sub_department.name if old_sub_department else 'Unassigned'} "
                    "to "
                    f"{new_sub_department.name if new_sub_department else 'Unassigned'}"
                ),
            )

        # ====================================================
        # ASSIGNMENT HISTORY + NOTIFICATION
        # ====================================================

        if assignment_changed:

            old_description = (
                "Unassigned"
            )

            if previous_assigned_user:

                old_description = (
                    f"{previous_assigned_user.first_name} "
                    f"{previous_assigned_user.last_name}"
                )

            new_description = (
                f"{assigned_user.first_name} "
                f"{assigned_user.last_name}"
            )

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="ASSIGNED",
                field_name="assigned_to_id",
                old_value=(
                    str(
                        original_assigned_to_id
                    )
                    if original_assigned_to_id
                    is not None
                    else None
                ),
                new_value=str(
                    assigned_user.id
                ),
                description=(
                    f"Assigned from "
                    f"{old_description} "
                    f"to "
                    f"{new_description}"
                ),
            )

            create_notification(
                db=db,
                user_id=assigned_user.id,
                notification_type="TICKET_ASSIGNED",
                title="Ticket Assigned",
                message=(
                    f"Ticket "
                    f"{ticket.ticket_number} "
                    "has been assigned to you."
                ),
                ticket_id=ticket.id,
            )

            if (
                previous_assigned_user
                and
                previous_assigned_user.id
                !=
                assigned_user.id
            ):

                create_notification(
                    db=db,
                    user_id=previous_assigned_user.id,
                    notification_type="TICKET_REASSIGNED",
                    title="Ticket Reassigned",
                    message=(
                        f"Ticket "
                        f"{ticket.ticket_number} "
                        "has been reassigned to another engineer."
                    ),
                    ticket_id=ticket.id,
                )

        # ====================================================
        # STATUS HISTORY
        # ====================================================

        if status_changed:

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="STATUS_CHANGED",
                field_name="status",
                old_value=original_status,
                new_value=new_status,
                description=(
                    f"Status changed from "
                    f"{original_status} "
                    f"to "
                    f"{new_status}"
                ),
            )

        # ====================================================
        # PRIORITY HISTORY
        # ====================================================

        if (
            "priority" in update_data
            and
            update_data[
                "priority"
            ]
            !=
            original_priority
        ):

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="PRIORITY_CHANGED",
                field_name="priority",
                old_value=original_priority,
                new_value=update_data[
                    "priority"
                ],
                description=(
                    f"Priority changed from "
                    f"{original_priority} "
                    f"to "
                    f"{update_data['priority']}"
                ),
            )

        # ====================================================
        # TITLE HISTORY
        # ====================================================

        if (
            "title" in update_data
            and
            update_data[
                "title"
            ]
            !=
            original_title
        ):

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="TITLE_CHANGED",
                field_name="title",
                old_value=original_title,
                new_value=update_data[
                    "title"
                ],
                description="Ticket title updated",
            )

        # ====================================================
        # DESCRIPTION HISTORY
        # ====================================================

        if (
            "description" in update_data
            and
            update_data[
                "description"
            ]
            !=
            original_description
        ):

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="DESCRIPTION_CHANGED",
                field_name="description",
                old_value=original_description,
                new_value=update_data[
                    "description"
                ],
                description="Ticket description updated",
            )

        # ====================================================
        # RESOLUTION HISTORY
        # ====================================================

        if resolution_changed:

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="RESOLUTION_UPDATED",
                field_name="resolution",
                old_value=original_resolution,
                new_value=update_data[
                    "resolution"
                ],
                description="Ticket resolution updated",
            )

        # ====================================================
        # CLOSE REQUEST
        # ====================================================

        if (
            status_changed
            and
            new_status ==
            "CLOSE_REQUESTED"
        ):

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="CLOSE_REQUESTED",
                field_name="status",
                old_value=original_status,
                new_value="CLOSE_REQUESTED",
                description=(
                    "Ticket closure requested by "
                    f"{current_user.first_name} "
                    f"{current_user.last_name}"
                ),
            )

            # ------------------------------------------------
            # Notify ONLY the assigned engineer's reporting
            # manager about the closure request.
            # ------------------------------------------------

            reporting_manager = None

            if ticket.assigned_to_id is not None:

                assigned_engineer = (
                    db.query(User)
                    .filter(
                        User.id == ticket.assigned_to_id
                    )
                    .first()
                )

                if (
                    assigned_engineer is not None
                    and assigned_engineer.manager_id is not None
                ):

                    reporting_manager = (
                        db.query(User)
                        .filter(
                            User.id == assigned_engineer.manager_id,
                            User.is_active.is_(True)
                        )
                        .first()
                    )

            if (
                reporting_manager is not None
                and user_has_permission(
                    reporting_manager,
                    "close_ticket"
                )
            ):

                create_notification(
                    db=db,
                    user_id=reporting_manager.id,
                    notification_type="CLOSE_REQUEST",
                    title="Ticket Close Request",
                    message=(
                        f"Ticket "
                        f"{ticket.ticket_number} "
                        "is waiting for closure review."
                    ),
                    ticket_id=ticket.id,
                )

        # ====================================================
        # CLOSED HISTORY + NOTIFICATION
        # ====================================================

        if (
            status_changed
            and
            new_status ==
            "CLOSED"
        ):

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="CLOSED",
                field_name="status",
                old_value=original_status,
                new_value="CLOSED",
                description=(
                    f"Ticket closed by "
                    f"{current_user.first_name} "
                    f"{current_user.last_name}"
                ),
            )

            if ticket.assigned_to_id:

                if (
                    ticket.assigned_to_id
                    !=
                    current_user.id
                ):

                    create_notification(
                        db=db,
                        user_id=ticket.assigned_to_id,
                        notification_type="TICKET_CLOSED",
                        title="Ticket Closed",
                        message=(
                            f"Ticket "
                            f"{ticket.ticket_number} "
                            "has been closed."
                        ),
                        ticket_id=ticket.id,
                    )

        # ====================================================
        # RESOLVED NOTIFICATION
        # ====================================================

        if (
            status_changed
            and
            new_status ==
            "RESOLVED"
        ):

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="RESOLVED",
                field_name="status",
                old_value=original_status,
                new_value="RESOLVED",
                description=(
                    f"Ticket resolved by "
                    f"{current_user.first_name} "
                    f"{current_user.last_name}"
                ),
            )

        # ====================================================
        # CANCELLED HISTORY + NOTIFICATION
        # ====================================================

        if (
            status_changed
            and
            new_status ==
            "CANCELLED"
        ):

            record_ticket_history(
                db=db,
                ticket_id=ticket.id,
                changed_by_id=current_user.id,
                action="CANCELLED",
                field_name="status",
                old_value=original_status,
                new_value="CANCELLED",
                description=(
                    f"Ticket cancelled by "
                    f"{current_user.first_name} "
                    f"{current_user.last_name}"
                ),
            )

            if ticket.assigned_to_id:

                if (
                    ticket.assigned_to_id
                    !=
                    current_user.id
                ):

                    create_notification(
                        db=db,
                        user_id=ticket.assigned_to_id,
                        notification_type="TICKET_CANCELLED",
                        title="Ticket Cancelled",
                        message=(
                            f"Ticket "
                            f"{ticket.ticket_number} "
                            "has been cancelled."
                        ),
                        ticket_id=ticket.id,
                    )

        # ====================================================
        # COMMIT EVERYTHING TOGETHER
        # ====================================================

        db.commit()

        db.refresh(
            ticket
        )

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update ticket"
        )

    return build_ticket_response(
        db,
        ticket
    )


# ============================================================
# DENY / SEND BACK CLOSURE REQUEST
# ============================================================

@router.post(
    "/{ticket_id}/deny-closure",
    response_model=ServiceTicketResponse,
)
def deny_closure_request(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("close_ticket")
    ),
):

    ticket = (
        db.query(ServiceTicket)
        .filter(
            ServiceTicket.id == ticket_id
        )
        .first()
    )

    if ticket is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    if ticket.status != "CLOSE_REQUESTED":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only tickets with a pending "
                "closure request can be denied"
            ),
        )

    requester_id = (
        ticket.close_requested_by_id
    )

    if requester_id is None:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This ticket does not have a "
                "closure requester"
            ),
        )

    requester = (
        db.query(User)
        .filter(
            User.id == requester_id
        )
        .first()
    )

    if requester is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "The user who requested closure "
                "could not be found"
            ),
        )

    original_status = (
        ticket.status
    )

    try:

        # ====================================================
        # RETURN TO OPEN
        # ====================================================

        ticket.status = "OPEN"

        ticket.close_requested_by_id = None

        ticket.close_requested_at = None

        # ====================================================
        # STATUS HISTORY
        # ====================================================

        record_ticket_history(
            db=db,
            ticket_id=ticket.id,
            changed_by_id=current_user.id,
            action="STATUS_CHANGED",
            field_name="status",
            old_value=original_status,
            new_value="OPEN",
            description=(
                "Status changed from "
                "CLOSE_REQUESTED to OPEN "
                "after closure request was denied by "
                f"{current_user.first_name} "
                f"{current_user.last_name}"
            ),
        )

        # ====================================================
        # DENIAL HISTORY
        # ====================================================

        record_ticket_history(
            db=db,
            ticket_id=ticket.id,
            changed_by_id=current_user.id,
            action="CLOSE_REQUEST_DENIED",
            field_name="status",
            old_value="CLOSE_REQUESTED",
            new_value="OPEN",
            description=(
                "Closure request denied by "
                f"{current_user.first_name} "
                f"{current_user.last_name}. "
                "Ticket sent back to "
                f"{requester.first_name} "
                f"{requester.last_name} "
                "for rework."
            ),
        )

        # ====================================================
        # NOTIFY ORIGINAL REQUESTER
        # ====================================================

        create_notification(
            db=db,
            user_id=requester_id,
            notification_type="CLOSE_REQUEST_DENIED",
            title="Closure Request Denied",
            message=(
                f"Closure request for ticket "
                f"{ticket.ticket_number} "
                "was denied. "
                "The ticket has been returned to OPEN "
                "status for rework. "
                "Please review and update the resolution "
                "before requesting closure again."
            ),
            ticket_id=ticket.id,
        )

        db.flush()

        db.commit()

        db.refresh(
            ticket
        )

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to deny closure request",
        )

    except Exception:

        db.rollback()

        raise

    return build_ticket_response(
        db,
        ticket
    )


# ============================================================
# DELETE / CANCEL TICKET
# ============================================================

@router.delete(
    "/{ticket_id}",
    response_model=ServiceTicketResponse
)
def cancel_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("cancel_ticket")
    )
):

    ticket = (
        db.query(ServiceTicket)
        .filter(
            ServiceTicket.id == ticket_id
        )
        .first()
    )

    if ticket is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    original_status = (
        ticket.status
    )

    ticket.status = "CANCELLED"

    try:

        record_ticket_history(
            db=db,
            ticket_id=ticket.id,
            changed_by_id=current_user.id,
            action="CANCELLED",
            field_name="status",
            old_value=original_status,
            new_value="CANCELLED",
            description=(
                f"Ticket cancelled by "
                f"{current_user.first_name} "
                f"{current_user.last_name}"
            ),
        )

        if ticket.assigned_to_id:

            if (
                ticket.assigned_to_id
                !=
                current_user.id
            ):

                create_notification(
                    db=db,
                    user_id=ticket.assigned_to_id,
                    notification_type="TICKET_CANCELLED",
                    title="Ticket Cancelled",
                    message=(
                        f"Ticket "
                        f"{ticket.ticket_number} "
                        "has been cancelled."
                    ),
                    ticket_id=ticket.id,
                )

        db.commit()

        db.refresh(
            ticket
        )

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to cancel ticket"
        )

    return build_ticket_response(
        db,
        ticket
    )
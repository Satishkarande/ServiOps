from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.auth import require_permission
from app.dependencies import get_db

from app.models.customer import Customer
from app.models.machine import Machine
from app.models.plant import Plant
from app.models.service_ticket import ServiceTicket
from app.models.ticket_spare_part import TicketSparePart
from app.models.user import User

from app.schemas.machine import (
    MachineCreate,
    MachineResponse,
    MachineUpdate,
    MachineOperationalDetailsResponse,
)


router = APIRouter(
    prefix="/machines",
    tags=["Machines"]
)


# ============================================================
# GET MACHINES
# ============================================================

@router.get(
    "/",
    response_model=list[MachineResponse]
)
def get_machines(
    plant_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_machine")
    )
):

    query = (
        db.query(Machine)
        .filter(
            Machine.is_active.is_(True)
        )
    )


    # --------------------------------------------------------
    # Optional plant filter
    #
    # GET /machines/
    #       -> all active machines
    #
    # GET /machines/?plant_id=4
    #       -> machines belonging to plant 4
    # --------------------------------------------------------

    if plant_id is not None:

        plant = (
            db.query(Plant)
            .filter(
                Plant.id == plant_id
            )
            .first()
        )


        if plant is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plant not found"
            )


        query = query.filter(
            Machine.plant_id == plant_id
        )


    machines = query.all()

    return machines
# ============================================================
# GET MACHINE OPERATIONAL DETAILS
# ============================================================

@router.get(
    "/{machine_id}/details",
    response_model=MachineOperationalDetailsResponse,
)
def get_machine_operational_details(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_machine")
    ),
):
    # --------------------------------------------------------
    # Machine
    # --------------------------------------------------------

    machine = (
        db.query(Machine)
        .filter(
            Machine.id == machine_id,
            Machine.is_active.is_(True),
        )
        .first()
    )

    if machine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found",
        )

    # --------------------------------------------------------
    # Plant
    # --------------------------------------------------------

    plant = (
        db.query(Plant)
        .filter(
            Plant.id == machine.plant_id
        )
        .first()
    )

    if plant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine plant not found",
        )

    # --------------------------------------------------------
    # Customer
    # --------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == plant.customer_id
        )
        .first()
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine customer not found",
        )

    # --------------------------------------------------------
    # SERVICE HISTORY
    #
    # Existing ticket relationship:
    #
    # Machine → ServiceTicket
    #
    # We query directly by machine_id rather than making
    # multiple frontend requests.
    # --------------------------------------------------------

    ticket_rows = (
        db.query(
            ServiceTicket,
            User,
        )
        .outerjoin(
            User,
            User.id == ServiceTicket.assigned_to_id,
        )
        .filter(
            ServiceTicket.machine_id == machine_id
        )
        .order_by(
            ServiceTicket.created_at.desc(),
            ServiceTicket.id.desc(),
        )
        .all()
    )

    service_history = []

    for ticket, assigned_user in ticket_rows:

        assigned_summary = None

        if assigned_user is not None:

            assigned_summary = {
                "id": assigned_user.id,
                "employee_code": assigned_user.employee_code,
                "first_name": assigned_user.first_name,
                "last_name": assigned_user.last_name,
                "email": assigned_user.email,
                "role": (
                    assigned_user.role.name
                    if assigned_user.role
                    else None
                ),
            }

        service_history.append(
            {
                "id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "customer_id": ticket.customer_id,
                "plant_id": ticket.plant_id,
                "machine_id": ticket.machine_id,
                "created_by_id": ticket.created_by_id,
                "assigned_to_id": ticket.assigned_to_id,
                "assigned_to": assigned_summary,
                "close_requested_by_id": (
                    ticket.close_requested_by_id
                ),
                "title": ticket.title,
                "description": ticket.description,
                "priority": ticket.priority,
                "status": ticket.status,
                "resolution": ticket.resolution,
                "close_requested_at": (
                    ticket.close_requested_at
                ),
                "created_at": ticket.created_at,
                "updated_at": ticket.updated_at,
                "closed_at": ticket.closed_at,
            }
        )

    # --------------------------------------------------------
    # SPARE PARTS USED
    #
    # Existing factual relationship:
    #
    # Machine
    #    ↓
    # ServiceTicket
    #    ↓
    # TicketSparePart
    #
    # No stock movement information is exposed in the UI.
    # --------------------------------------------------------

    spare_part_rows = (
        db.query(TicketSparePart)
        .options(
            joinedload(
                TicketSparePart.spare_part
            ),
            joinedload(
                TicketSparePart.created_by
            ),
            joinedload(
                TicketSparePart.stock_movement
            ),
        )
        .join(
            ServiceTicket,
            TicketSparePart.ticket_id
            == ServiceTicket.id,
        )
        .filter(
            ServiceTicket.machine_id == machine_id
        )
        .order_by(
            TicketSparePart.created_at.desc(),
            TicketSparePart.id.desc(),
        )
        .all()
    )

    spare_parts_used = []

    for usage in spare_part_rows:

        spare_part = usage.spare_part
        created_by = usage.created_by
        stock_movement = usage.stock_movement

        if (
            spare_part is None
            or created_by is None
            or stock_movement is None
        ):
            continue

        spare_parts_used.append(
            {
                "id": usage.id,
                "ticket_id": usage.ticket_id,
                "spare_part_id": usage.spare_part_id,
                "location": usage.location,
                "quantity": usage.quantity,
                "stock_movement_id": (
                    usage.stock_movement_id
                ),
                "created_by_id": usage.created_by_id,
                "notes": usage.notes,
                "created_at": usage.created_at,

                "spare_part": {
                    "id": spare_part.id,
                    "part_code": spare_part.part_code,
                    "name": spare_part.name,
                    "unit": spare_part.unit,
                },

                "created_by": {
                    "id": created_by.id,
                    "employee_code": (
                        created_by.employee_code
                    ),
                    "first_name": (
                        created_by.first_name
                    ),
                    "last_name": (
                        created_by.last_name
                    ),
                },

                "stock_movement": {
                    "id": stock_movement.id,
                    "movement_type": (
                        stock_movement.movement_type
                    ),
                    "quantity": (
                        stock_movement.quantity
                    ),
                    "location": (
                        stock_movement.location
                    ),
                    "created_at": (
                        stock_movement.created_at
                    ),
                },
            }
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "machine": machine,

        "customer": {
            "id": customer.id,
            "customer_code": customer.customer_code,
            "name": customer.name,
        },

        "plant": {
            "id": plant.id,
            "plant_code": plant.plant_code,
            "name": plant.name,
        },

        "service_history": service_history,

        "spare_parts_used": spare_parts_used,
    }

# ============================================================
# GET SINGLE MACHINE
# ============================================================

@router.get(
    "/{machine_id}",
    response_model=MachineResponse
)
def get_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_machine")
    )
):

    machine = (
        db.query(Machine)
        .filter(
            Machine.id == machine_id,
            Machine.is_active.is_(True)
        )
        .first()
    )


    if machine is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found"
        )


    return machine


# ============================================================
# CREATE MACHINE
# ============================================================

@router.post(
    "/",
    response_model=MachineResponse,
    status_code=status.HTTP_201_CREATED
)
def create_machine(
    machine_data: MachineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("create_machine")
    )
):

    # --------------------------------------------------------
    # Validate parent plant
    # --------------------------------------------------------

    plant = (
        db.query(Plant)
        .filter(
            Plant.id == machine_data.plant_id
        )
        .first()
    )


    if plant is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )


    if not plant.is_active:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create machine in inactive plant"
        )


    # --------------------------------------------------------
    # Check machine code
    # --------------------------------------------------------

    existing_code = (
        db.query(Machine)
        .filter(
            Machine.machine_code
            == machine_data.machine_code
        )
        .first()
    )


    if existing_code:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Machine code already exists"
        )


    # --------------------------------------------------------
    # Check serial number
    # --------------------------------------------------------

    existing_serial = (
        db.query(Machine)
        .filter(
            Machine.serial_number
            == machine_data.serial_number
        )
        .first()
    )


    if existing_serial:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Serial number already exists"
        )


    # --------------------------------------------------------
    # Create machine
    # --------------------------------------------------------

    new_machine = Machine(

        plant_id=
            machine_data.plant_id,

        machine_code=
            machine_data.machine_code,

        name=
            machine_data.name,

        model=
            machine_data.model,

        serial_number=
            machine_data.serial_number,

        manufacturer=
            machine_data.manufacturer,

        installation_date=
            machine_data.installation_date,

        status=
            machine_data.status,

        warranty_expiry=
            machine_data.warranty_expiry,

        is_active=True
    )


    db.add(
        new_machine
    )


    try:

        db.commit()

        db.refresh(
            new_machine
        )


    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Machine code or serial number already exists"
        )


    return new_machine


# ============================================================
# UPDATE MACHINE
# ============================================================

@router.patch(
    "/{machine_id}",
    response_model=MachineResponse
)
def update_machine(
    machine_id: int,
    machine_data: MachineUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("update_machine")
    )
):
    machine = (
        db.query(Machine)
        .filter(Machine.id == machine_id)
        .first()
    )

    if machine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found"
        )

    update_data = machine_data.model_dump(
        exclude_unset=True
    )

    # ============================================================
    # Validate Plant Change
    # ============================================================

    if "plant_id" in update_data:

        plant = (
            db.query(Plant)
            .filter(
                Plant.id == update_data["plant_id"]
            )
            .first()
        )

        if plant is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plant not found"
            )

        if not plant.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot move machine to inactive plant"
            )

    # ============================================================
    # Update Machine
    # ============================================================

    for field, value in update_data.items():
        setattr(machine, field, value)

    try:
        db.commit()
        db.refresh(machine)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update machine"
        )

    return machine


    # --------------------------------------------------------
    # IMPORTANT:
    #
    # plant_id is intentionally NOT part of MachineUpdate.
    #
    # Therefore the machine cannot accidentally be moved
    # between plants through normal editing.
    # --------------------------------------------------------


    for field, value in update_data.items():

        setattr(
            machine,
            field,
            value
        )


    db.commit()

    db.refresh(
        machine
    )


    return machine


# ============================================================
# DEACTIVATE MACHINE
# ============================================================

@router.delete(
    "/{machine_id}",
    response_model=MachineResponse
)
def deactivate_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "deactivate_machine"
        )
    )
):

    machine = (
        db.query(Machine)
        .filter(
            Machine.id == machine_id
        )
        .first()
    )


    if machine is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found"
        )


    machine.is_active = False


    db.commit()

    db.refresh(
        machine
    )


    return machine
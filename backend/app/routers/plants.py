from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.customer import Customer
from app.models.plant import Plant
from app.models.machine import Machine
from app.models.service_ticket import ServiceTicket
from app.models.ticket_spare_part import TicketSparePart
from app.models.user import User
from app.schemas.plant import (
    PlantCreate,
    PlantResponse,
    PlantUpdate,
    PlantOperationalDetailsResponse,
)


router = APIRouter(
    prefix="/plants",
    tags=["Plants"]
)


# ============================================================
# GET PLANTS
# ============================================================

@router.get(
    "/",
    response_model=list[PlantResponse]
)
def get_plants(
    customer_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_plant")
    )
):
    query = (
        db.query(Plant)
        .filter(
            Plant.is_active.is_(True)
        )
    )

    if customer_id is not None:
        query = query.filter(
            Plant.customer_id == customer_id
        )

    return query.all()


    # --------------------------------------------------------
    # Optional customer filter
    #
    # GET /plants/
    #       -> all active plants
    #
    # GET /plants/?customer_id=5
    #       -> only plants belonging to customer 5
    # --------------------------------------------------------

    if customer_id is not None:

        customer = (
            db.query(Customer)
            .filter(
                Customer.id == customer_id
            )
            .first()
        )

        if customer is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )


        query = query.filter(
            Plant.customer_id == customer_id
        )


    plants = query.all()

    return plants

# ============================================================
# GET PLANT OPERATIONAL DETAILS
# ============================================================

@router.get(
    "/{plant_id}/details",
    response_model=PlantOperationalDetailsResponse
)
def get_plant_operational_details(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_plant")
    )
):

    # --------------------------------------------------------
    # Get active plant
    # --------------------------------------------------------

    plant = (
        db.query(Plant)
        .filter(
            Plant.id == plant_id,
            Plant.is_active.is_(True)
        )
        .first()
    )

    if plant is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )


    # --------------------------------------------------------
    # Get customer
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
            detail="Customer not found"
        )


    # --------------------------------------------------------
    # Get machines belonging to this plant
    # --------------------------------------------------------

    machines = (
        db.query(Machine)
        .filter(
            Machine.plant_id == plant_id,
            Machine.is_active.is_(True)
        )
        .order_by(
            Machine.name.asc()
        )
        .all()
    )


    machine_data = []

    for machine in machines:

        machine_data.append(
            {
                "id": machine.id,

                "plant_id":
                    machine.plant_id,

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

                "installation_date":
                    machine.installation_date,

                "status":
                    machine.status,

                "warranty_expiry":
                    machine.warranty_expiry,

                "is_active":
                    machine.is_active,

                "created_at":
                    machine.created_at,

                "updated_at":
                    machine.updated_at,
            }
        )


    # --------------------------------------------------------
    # Get service history for this plant
    # --------------------------------------------------------

    tickets = (
        db.query(ServiceTicket)
        .filter(
            ServiceTicket.plant_id == plant_id
        )
        .order_by(
            ServiceTicket.created_at.desc()
        )
        .all()
    )


    service_history = []

    for ticket in tickets:

        # ----------------------------------------------------
        # Assigned engineer
        #
        # ServiceTicket stores assigned_to_id rather than
        # an assigned_to SQLAlchemy relationship.
        # ----------------------------------------------------

        assigned_to = None

        if ticket.assigned_to_id is not None:

            assigned_user = (
                db.query(User)
                .filter(
                    User.id ==
                    ticket.assigned_to_id
                )
                .first()
            )

            if assigned_user is not None:

                assigned_to = {
                    "id":
                        assigned_user.id,

                    "employee_code":
                        assigned_user.employee_code,

                    "first_name":
                        assigned_user.first_name,

                    "last_name":
                        assigned_user.last_name,

                    "email":
                        assigned_user.email,

                    "role":
                        assigned_user.role.name
                        if assigned_user.role
                        else None,
                }


        service_history.append(
            {
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

                "assigned_to_id":
                    ticket.assigned_to_id,

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

                "close_requested_by_id":
                    ticket.close_requested_by_id,

                "close_requested_at":
                    ticket.close_requested_at,

                "created_at":
                    ticket.created_at,

                "updated_at":
                    ticket.updated_at,

                "closed_at":
                    ticket.closed_at,

                "assigned_to":
                    assigned_to,
            }
        )


    # --------------------------------------------------------
    # Get spare parts used through plant tickets
    # --------------------------------------------------------

    spare_part_rows = (
        db.query(TicketSparePart)
        .join(
            ServiceTicket,
            TicketSparePart.ticket_id
            == ServiceTicket.id
        )
        .filter(
            ServiceTicket.plant_id == plant_id
        )
        .order_by(
            TicketSparePart.created_at.desc()
        )
        .all()
    )


    spare_parts_used = []

    for item in spare_part_rows:

        # ----------------------------------------------------
        # Spare part
        # ----------------------------------------------------

        spare_part = None

        if item.spare_part is not None:

            spare_part = {
                "id":
                    item.spare_part.id,

                "part_code":
                    item.spare_part.part_code,

                "name":
                    item.spare_part.name,

                "unit":
                    item.spare_part.unit,
            }


        # ----------------------------------------------------
        # User who consumed the part
        # ----------------------------------------------------

        created_by = None

        if item.created_by is not None:

            created_by = {
                "id":
                    item.created_by.id,

                "employee_code":
                    item.created_by.employee_code,

                "first_name":
                    item.created_by.first_name,

                "last_name":
                    item.created_by.last_name,
            }


        # ----------------------------------------------------
        # Stock movement
        # ----------------------------------------------------

        stock_movement = None

        if item.stock_movement is not None:

            stock_movement = {
                "id":
                    item.stock_movement.id,

                "movement_type":
                    item.stock_movement.movement_type,

                "quantity":
                    item.stock_movement.quantity,

                "location":
                    item.stock_movement.location,

                "created_at":
                    item.stock_movement.created_at,
            }


        # ----------------------------------------------------
        # Ticket
        # ----------------------------------------------------

        ticket = (
            db.query(ServiceTicket)
            .filter(
                ServiceTicket.id ==
                item.ticket_id
            )
            .first()
        )


        spare_parts_used.append(
            {
                "id":
                    item.id,

                "ticket_id":
                    item.ticket_id,

                "spare_part_id":
                    item.spare_part_id,

                "location":
                    item.location,

                "quantity":
                    item.quantity,

                "stock_movement_id":
                    item.stock_movement_id,

                "created_by_id":
                    item.created_by_id,

                "notes":
                    item.notes,

                "created_at":
                    item.created_at,

                "spare_part":
                    spare_part,

                "created_by":
                    created_by,

                "stock_movement":
                    stock_movement,

                "ticket":
                    {
                        "id":
                            ticket.id,

                        "ticket_number":
                            ticket.ticket_number,
                    }
                    if ticket
                    else None,
            }
        )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "plant":
            plant,

        "customer": {
            "id":
                customer.id,

            "customer_code":
                customer.customer_code,

            "name":
                customer.name,
        },

        "machines":
            machine_data,

        "service_history":
            service_history,

        "spare_parts_used":
            spare_parts_used,
    }
# ============================================================
# GET SINGLE PLANT
# ============================================================

@router.get(
    "/{plant_id}",
    response_model=PlantResponse
)
def get_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_plant")
    )
):

    plant = (
        db.query(Plant)
        .filter(
            Plant.id == plant_id,
            Plant.is_active.is_(True)
        )
        .first()
    )


    if plant is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found"
        )


    return plant


# ============================================================
# CREATE PLANT
# ============================================================

@router.post(
    "/",
    response_model=PlantResponse,
    status_code=status.HTTP_201_CREATED
)
def create_plant(
    plant_data: PlantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("create_plant")
    )
):

    # --------------------------------------------------------
    # Validate customer
    # --------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == plant_data.customer_id
        )
        .first()
    )


    if customer is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )


    if not customer.is_active:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create plant for inactive customer"
        )


    # --------------------------------------------------------
    # Check duplicate plant code
    # --------------------------------------------------------

    existing_plant = (
        db.query(Plant)
        .filter(
            Plant.plant_code
            == plant_data.plant_code
        )
        .first()
    )


    if existing_plant:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Plant code already exists"
        )


    # --------------------------------------------------------
    # Create plant
    # --------------------------------------------------------

    new_plant = Plant(

        customer_id=
            plant_data.customer_id,

        plant_code=
            plant_data.plant_code,

        name=
            plant_data.name,

        address=
            plant_data.address,

        city=
            plant_data.city,

        state=
            plant_data.state,

        country=
            plant_data.country,

        contact_name=
            plant_data.contact_name,

        contact_email=
            plant_data.contact_email,

        contact_phone=
            plant_data.contact_phone,

        is_active=True
    )


    db.add(new_plant)


    try:

        db.commit()

        db.refresh(
            new_plant
        )


    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Plant already exists"
        )


    return new_plant


# ============================================================
# UPDATE PLANT
# ============================================================

@router.patch(
    "/{plant_id}",
    response_model=PlantResponse
)
def update_plant(
    plant_id: int,
    plant_data: PlantUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("update_plant")
    )
):

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


    update_data = (
        plant_data.model_dump(
            exclude_unset=True
        )
    )


    # --------------------------------------------------------
    # IMPORTANT:
    #
    # customer_id is intentionally NOT part of PlantUpdate.
    #
    # Therefore the plant remains permanently associated
    # with its customer through normal editing.
    # --------------------------------------------------------


    for field, value in update_data.items():

        setattr(
            plant,
            field,
            value
        )


    db.commit()

    db.refresh(
        plant
    )


    return plant


# ============================================================
# DEACTIVATE PLANT
# ============================================================

@router.delete(
    "/{plant_id}",
    response_model=PlantResponse
)
def deactivate_plant(
    plant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "deactivate_plant"
        )
    )
):

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


    plant.is_active = False


    db.commit()

    db.refresh(
        plant
    )


    return plant
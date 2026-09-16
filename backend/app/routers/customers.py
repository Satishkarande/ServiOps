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
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
    CustomerOperationalDetailsResponse,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


@router.get(
    "/",
    response_model=list[CustomerResponse]
)
def get_customers(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_customer")
    )
):
    customers = (
        db.query(Customer)
        .filter(Customer.is_active.is_(True))
        .all()
    )

    return customers

# ============================================================
# GET CUSTOMER OPERATIONAL DETAILS
# ============================================================

@router.get(
    "/{customer_id}/details",
    response_model=CustomerOperationalDetailsResponse
)
def get_customer_operational_details(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_customer")
    )
):

    # --------------------------------------------------------
    # Get active customer
    # --------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.is_active.is_(True)
        )
        .first()
    )

    if customer is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )


    # --------------------------------------------------------
    # Get customer's active plants
    # --------------------------------------------------------

    plants = (
        db.query(Plant)
        .filter(
            Plant.customer_id == customer_id,
            Plant.is_active.is_(True)
        )
        .order_by(
            Plant.name.asc()
        )
        .all()
    )


    plant_data = []


    for plant in plants:

        machine_count = (
            db.query(Machine)
            .filter(
                Machine.plant_id == plant.id,
                Machine.is_active.is_(True)
            )
            .count()
        )


        active_ticket_count = (
            db.query(ServiceTicket)
            .filter(
                ServiceTicket.plant_id == plant.id,
                ServiceTicket.status.notin_(
                    [
                        "CLOSED",
                        "CANCELLED",
                    ]
                )
            )
            .count()
        )


        plant_data.append(
            {
                "id":
                    plant.id,

                "customer_id":
                    plant.customer_id,

                "plant_code":
                    plant.plant_code,

                "name":
                    plant.name,

                "address":
                    plant.address,

                "city":
                    plant.city,

                "state":
                    plant.state,

                "country":
                    plant.country,

                "contact_name":
                    plant.contact_name,

                "contact_email":
                    plant.contact_email,

                "contact_phone":
                    plant.contact_phone,

                "is_active":
                    plant.is_active,

                "created_at":
                    plant.created_at,

                "updated_at":
                    plant.updated_at,

                "machine_count":
                    machine_count,

                "active_ticket_count":
                    active_ticket_count,
            }
        )


    # --------------------------------------------------------
    # Get customer's active machines
    # --------------------------------------------------------

    machines = (
        db.query(Machine)
        .join(
            Plant,
            Machine.plant_id == Plant.id
        )
        .filter(
            Plant.customer_id == customer_id,
            Machine.is_active.is_(True)
        )
        .order_by(
            Machine.name.asc()
        )
        .all()
    )


    machine_data = []


    for machine in machines:

        plant = (
            db.query(Plant)
            .filter(
                Plant.id == machine.plant_id
            )
            .first()
        )


        machine_data.append(
            {
                "id":
                    machine.id,

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

                "plant":
                    {
                        "id":
                            plant.id,

                        "plant_code":
                            plant.plant_code,

                        "name":
                            plant.name,
                    }
                    if plant
                    else None,
            }
        )


    # --------------------------------------------------------
    # Get service history
    # --------------------------------------------------------

    tickets = (
        db.query(ServiceTicket)
        .filter(
            ServiceTicket.customer_id == customer_id
        )
        .order_by(
            ServiceTicket.created_at.desc()
        )
        .all()
    )


    service_history = []


    for ticket in tickets:

        # ----------------------------------------------------
        # Created By
        # ----------------------------------------------------

        created_by = None


        if ticket.created_by_id is not None:

            created_user = (
                db.query(User)
                .filter(
                    User.id ==
                    ticket.created_by_id
                )
                .first()
            )


            if created_user is not None:

                created_by = {
                    "id":
                        created_user.id,

                    "employee_code":
                        created_user.employee_code,

                    "first_name":
                        created_user.first_name,

                    "last_name":
                        created_user.last_name,

                    "email":
                        created_user.email,
                }


        # ----------------------------------------------------
        # Assigned Engineer
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


        # ----------------------------------------------------
        # Plant
        # ----------------------------------------------------

        ticket_plant = (
            db.query(Plant)
            .filter(
                Plant.id ==
                ticket.plant_id
            )
            .first()
        )


        # ----------------------------------------------------
        # Machine
        # ----------------------------------------------------

        ticket_machine = (
            db.query(Machine)
            .filter(
                Machine.id ==
                ticket.machine_id
            )
            .first()
        )


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

                "created_by":
                    created_by,

                "assigned_to":
                    assigned_to,

                "plant":
                    {
                        "id":
                            ticket_plant.id,

                        "plant_code":
                            ticket_plant.plant_code,

                        "name":
                            ticket_plant.name,
                    }
                    if ticket_plant
                    else None,

                "machine":
                    {
                        "id":
                            ticket_machine.id,

                        "machine_code":
                            ticket_machine.machine_code,

                        "name":
                            ticket_machine.name,

                        "model":
                            ticket_machine.model,
                    }
                    if ticket_machine
                    else None,
            }
        )


    # --------------------------------------------------------
    # Get spare parts used by customer's tickets
    # --------------------------------------------------------

    spare_part_rows = (
        db.query(TicketSparePart)
        .join(
            ServiceTicket,
            TicketSparePart.ticket_id
            == ServiceTicket.id
        )
        .filter(
            ServiceTicket.customer_id ==
            customer_id
        )
        .order_by(
            TicketSparePart.created_at.desc()
        )
        .all()
    )


    spare_parts_used = []


    for item in spare_part_rows:

        # ----------------------------------------------------
        # Spare Part
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
        # Created By
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


        # ----------------------------------------------------
        # Plant
        # ----------------------------------------------------

        ticket_plant = None


        if ticket is not None:

            ticket_plant = (
                db.query(Plant)
                .filter(
                    Plant.id ==
                    ticket.plant_id
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

                "ticket":
                    {
                        "id":
                            ticket.id,

                        "ticket_number":
                            ticket.ticket_number,
                    }
                    if ticket
                    else None,

                "plant":
                    {
                        "id":
                            ticket_plant.id,

                        "plant_code":
                            ticket_plant.plant_code,

                        "name":
                            ticket_plant.name,
                    }
                    if ticket_plant
                    else None,
            }
        )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "customer":
            customer,

        "plants":
            plant_data,

        "machines":
            machine_data,

        "service_history":
            service_history,

        "spare_parts_used":
            spare_parts_used,
    }

@router.get(
    "/{customer_id}",
    response_model=CustomerResponse
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_customer")
    )
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.is_active.is_(True)
        )
        .first()
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    return customer


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED
)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("create_customer")
    )
):
    existing_customer = (
        db.query(Customer)
        .filter(
            Customer.customer_code
            == customer_data.customer_code
        )
        .first()
    )

    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer code already exists"
        )

    new_customer = Customer(
        customer_code=customer_data.customer_code,
        name=customer_data.name,
        email=customer_data.email,
        phone=customer_data.phone,
        address=customer_data.address,
        city=customer_data.city,
        country=customer_data.country,
        is_active=True
    )

    db.add(new_customer)

    try:
        db.commit()
        db.refresh(new_customer)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer already exists"
        )

    return new_customer


@router.patch(
    "/{customer_id}",
    response_model=CustomerResponse
)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("update_customer")
    )
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    update_data = customer_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    return customer


@router.delete(
    "/{customer_id}",
    response_model=CustomerResponse
)
def deactivate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
   current_user=Depends(
    require_permission("deactivate_customer")
    )
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    customer.is_active = False

    db.commit()
    db.refresh(customer)

    return customer
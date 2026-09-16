"""
ServiOps development data seed.

Purpose:
    Populate a realistic, relational development/demo dataset without using
    the frontend for every record.

Safety:
    - Idempotent for the records created by this script.
    - Existing records are not deleted or overwritten.
    - Run Alembic migrations before running this script.
    - This is development/demo data only; it does not create Cognito users.

Run from the backend directory:
    python -m seed.seed_database

The script uses the current SQLAlchemy models and their real foreign-key
relationships. It creates:
    departments -> sub-departments -> roles/permissions -> users
    customers -> plants -> machines -> service tickets
    tickets -> history/comments/mentions/notifications
    spare parts -> inventory -> stock movements
    tickets -> consumed spare parts -> stock movements
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

# Import all models so SQLAlchemy can resolve relationship targets.
from app.database import SessionLocal
from app.models.customer import Customer
from app.models.department import Department
from app.models.inventory import Inventory
from app.models.machine import Machine
from app.models.notification import Notification
from app.models.permission import Permission
from app.models.plant import Plant
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.service_ticket import ServiceTicket
from app.models.spare_part import SparePart
from app.models.stock_movement import StockMovement
from app.models.sub_department import SubDepartment
from app.models.ticket_comment import TicketComment
from app.models.ticket_comment_mentions import TicketCommentMention
from app.models.ticket_history import TicketHistory
from app.models.ticket_spare_part import TicketSparePart
from app.models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_or_create(db: Session, model, lookup: dict, defaults: dict | None = None):
    obj = db.query(model).filter_by(**lookup).first()
    if obj:
        return obj, False

    obj = model(**lookup, **(defaults or {}))
    db.add(obj)
    db.flush()
    return obj, True


def add_history(
    db: Session,
    ticket: ServiceTicket,
    user: User,
    action: str,
    description: str,
    field_name: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    created_at: datetime | None = None,
):
    # Keep the seed idempotent by checking the ticket/action/description.
    existing = (
        db.query(TicketHistory)
        .filter(
            TicketHistory.ticket_id == ticket.id,
            TicketHistory.action == action,
            TicketHistory.description == description,
        )
        .first()
    )
    if existing:
        return existing

    item = TicketHistory(
        ticket_id=ticket.id,
        changed_by_id=user.id,
        action=action,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        description=description,
        created_at=created_at or datetime.utcnow(),
    )
    db.add(item)
    db.flush()
    return item


def add_comment(
    db: Session,
    ticket: ServiceTicket,
    user: User,
    text: str,
    created_at: datetime,
):
    existing = (
        db.query(TicketComment)
        .filter(
            TicketComment.ticket_id == ticket.id,
            TicketComment.created_by_id == user.id,
            TicketComment.comment == text,
        )
        .first()
    )
    if existing:
        return existing

    comment = TicketComment(
        ticket_id=ticket.id,
        created_by_id=user.id,
        comment=text,
        created_at=created_at,
        updated_at=created_at,
    )
    db.add(comment)
    db.flush()
    return comment


def add_notification(
    db: Session,
    user: User,
    ticket: ServiceTicket,
    notification_type: str,
    title: str,
    message: str,
    created_at: datetime,
):
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user.id,
            Notification.ticket_id == ticket.id,
            Notification.type == notification_type,
            Notification.title == title,
        )
        .first()
    )
    if existing:
        return existing

    item = Notification(
        user_id=user.id,
        ticket_id=ticket.id,
        type=notification_type,
        title=title,
        message=message,
        is_read=False,
        created_at=created_at,
    )
    db.add(item)
    db.flush()
    return item


# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

PERMISSIONS = {
    "view_dashboard": "View dashboard and operational summaries",
    "view_ticket": "View service tickets",
    "create_ticket": "Create service tickets",
    "update_ticket": "Update service tickets",
    "start_ticket": "Start assigned service tickets",
    "resolve_ticket": "Resolve service tickets",
    "request_close_ticket": "Request ticket closure",
    "close_ticket": "Approve and close service tickets",
    "cancel_ticket": "Cancel service tickets",
    "comment_ticket": "Add and edit ticket comments",
    "view_customer": "View customers",
    "create_customer": "Create customers",
    "update_customer": "Update customers",
    "deactivate_customer": "Deactivate customers",
    "view_plant": "View plants",
    "create_plant": "Create plants",
    "update_plant": "Update plants",
    "deactivate_plant": "Deactivate plants",
    "view_machine": "View machines",
    "create_machine": "Create machines",
    "update_machine": "Update machines",
    "deactivate_machine": "Deactivate machines",
    "manage_users": "Manage users",
    "manage_roles": "Manage roles",
    "manage_permissions": "Manage permissions",
    "view_spare": "View spare parts",
    "create_spare": "Create spare parts",
    "update_spare": "Update spare parts",
    "deactivate_spare": "Deactivate spare parts",
    "view_inventory": "View inventory balances and low-stock items",
    "manage_inventory": "Receive, issue, and adjust inventory",
    "view_stock_movement": "View stock movement history",
    "consume_ticket_spare": "Record spare parts consumed on service tickets",
}

ROLE_PERMISSIONS = {
    "Administrator": list(PERMISSIONS),
    "Service Manager": [
        "view_dashboard", "view_ticket", "create_ticket", "update_ticket",
        "start_ticket", "resolve_ticket", "request_close_ticket", "close_ticket",
        "cancel_ticket", "comment_ticket", "view_customer", "view_plant",
        "view_machine", "view_spare", "view_inventory", "view_stock_movement",
        "consume_ticket_spare",
    ],
    "Service Engineer": [
        "view_dashboard", "view_ticket", "create_ticket", "update_ticket",
        "start_ticket", "resolve_ticket", "request_close_ticket", "comment_ticket",
        "view_customer", "view_plant", "view_machine", "view_spare",
        "view_inventory", "view_stock_movement", "consume_ticket_spare",
    ],
    "Spare Parts Manager": [
        "view_dashboard", "view_spare", "create_spare", "update_spare",
        "deactivate_spare", "view_inventory", "manage_inventory",
        "view_stock_movement", "consume_ticket_spare",
    ],
    "Sales User": [
        "view_dashboard", "view_customer", "view_plant", "view_machine",
    ],
    "IT User": [
        "view_dashboard",
    ],
}

DEPARTMENTS = {
    "Service": [
        "Field Service",
        "Technical Support",
        "Installation & Commissioning",
        "Preventive Maintenance",
    ],
    "Spare Parts": [
        "Parts Sales",
        "Parts Planning",
        "Parts Warehouse",
    ],
    "Sales": [
        "Industrial Sales",
        "Key Accounts",
        "Sales Support",
    ],
    "IT": [
        "Infrastructure",
        "Application Support",
        "IT Helpdesk",
    ],
}


def seed_reference_data(db: Session):
    permissions = {}
    for name, description in PERMISSIONS.items():
        permissions[name], _ = get_or_create(
            db, Permission,
            {"name": name},
            {"description": description, "is_active": True},
        )

    roles = {}
    for name, description in {
        "Administrator": "Full system administration",
        "Service Manager": "Service operations manager",
        "Service Engineer": "Field/service engineer",
        "Spare Parts Manager": "Spare parts and inventory manager",
        "Sales User": "Sales operations user",
        "IT User": "IT operations user",
    }.items():
        roles[name], _ = get_or_create(
            db, Role,
            {"name": name},
            {"description": description, "is_active": True},
        )

    for role_name, permission_names in ROLE_PERMISSIONS.items():
        role = roles[role_name]
        for permission_name in permission_names:
            permission = permissions[permission_name]
            exists = (
                db.query(RolePermission)
                .filter(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == permission.id,
                )
                .first()
            )
            if not exists:
                db.add(RolePermission(
                    role_id=role.id,
                    permission_id=permission.id,
                ))

    departments = {}
    sub_departments = {}
    for department_name, sub_names in DEPARTMENTS.items():
        departments[department_name], _ = get_or_create(
            db, Department,
            {"name": department_name},
            {"description": f"{department_name} department"},
        )
        for sub_name in sub_names:
            sub_departments[sub_name], _ = get_or_create(
                db, SubDepartment,
                {"department_id": departments[department_name].id, "name": sub_name},
                {"description": f"{sub_name} sub-department", "is_active": True},
            )

    db.flush()
    return permissions, roles, departments, sub_departments


# ---------------------------------------------------------------------------
# Users and hierarchy
# ---------------------------------------------------------------------------

def seed_users(db: Session, departments, sub_departments, roles):
    specs = [
        ("EMP001", "Admin", "User", "admin.user", "admin@serviops.local",
         "IT", "Infrastructure", "Administrator", None),
        ("EMP002", "Amit", "Sharma", "amit.sharma", "amit.sharma@serviops.local",
         "Service", "Field Service", "Service Manager", "EMP001"),
        ("EMP003", "Rahul", "Patil", "rahul.patil", "rahul.patil@serviops.local",
         "Service", "Field Service", "Service Engineer", "EMP002"),
        ("EMP004", "Neha", "Kulkarni", "neha.kulkarni", "neha.kulkarni@serviops.local",
         "Service", "Technical Support", "Service Engineer", "EMP002"),
        ("EMP005", "Vikram", "Joshi", "vikram.joshi", "vikram.joshi@serviops.local",
         "Service", "Preventive Maintenance", "Service Engineer", "EMP002"),
        ("EMP006", "Priya", "Deshmukh", "priya.deshmukh", "priya.deshmukh@serviops.local",
         "Spare Parts", "Parts Warehouse", "Spare Parts Manager", "EMP001"),
        ("EMP007", "Karan", "Mehta", "karan.mehta", "karan.mehta@serviops.local",
         "Sales", "Industrial Sales", "Sales User", "EMP001"),
        ("EMP008", "Sneha", "Rao", "sneha.rao", "sneha.rao@serviops.local",
         "IT", "Application Support", "IT User", "EMP001"),
    ]

    users = {}
    for code, first, last, username, email, dept, subdept, role_name, manager_code in specs:
        user, _ = get_or_create(
            db, User,
            {"employee_code": code},
            {
                "username": username,
                "first_name": first,
                "last_name": last,
                "email": email,
                "department_id": departments[dept].id,
                "sub_department_id": sub_departments[subdept].id,
                "role_id": roles[role_name].id,
                "is_active": True,
                "cognito_user_id": None,
            },
        )
        # The known demo users are seed-owned records. Keep their identity
        # stable, but repair their organizational fields on every seed run so
        # the demo hierarchy remains deterministic even if these users were
        # previously created/edited through the frontend.
        user.username = username
        user.first_name = first
        user.last_name = last
        user.email = email
        user.department_id = departments[dept].id
        user.sub_department_id = sub_departments[subdept].id
        user.role_id = roles[role_name].id
        user.is_active = True
        users[code] = user

    db.flush()

    for code, first, last, username, email, dept, subdept, role_name, manager_code in specs:
        user = users[code]
        user.manager_id = users[manager_code].id if manager_code else None

    db.flush()

    db.flush()
    return users


# ---------------------------------------------------------------------------
# Customer -> Plant -> Machine hierarchy
# ---------------------------------------------------------------------------

def seed_assets(db: Session):
    customer_specs = [
        ("CUST-001", "Tata Engineering Solutions", "ops@tata-example.local",
         "+91 20 4000 1001", "Pimpri Industrial Area", "Pune", "India"),
        ("CUST-002", "Mahindra Industrial Systems", "maintenance@mahindra-example.local",
         "+91 22 4000 1002", "Andheri Industrial Estate", "Mumbai", "India"),
        ("CUST-003", "ABC Manufacturing Pvt Ltd", "plant@abc-example.local",
         "+91 79 4000 1003", "GIDC Industrial Estate", "Ahmedabad", "India"),
        ("CUST-004", "Reliance Process Industries", "engineering@reliance-example.local",
         "+91 22 4000 1004", "Hazira Industrial Zone", "Surat", "India"),
        ("CUST-005", "Kirloskar Automation", "service@kirloskar-example.local",
         "+91 20 4000 1005", "Industrial Estate", "Pune", "India"),
        ("CUST-006", "Bharat Heavy Components", "support@bharat-example.local",
         "+91 80 4000 1006", "Peenya Industrial Area", "Bengaluru", "India"),
    ]

    customers = {}
    for code, name, email, phone, address, city, country in customer_specs:
        customers[code], _ = get_or_create(
            db, Customer,
            {"customer_code": code},
            {
                "name": name, "email": email, "phone": phone,
                "address": address, "city": city, "country": country,
                "is_active": True,
            },
        )

    plant_specs = [
        ("PLT-001", "CUST-001", "Pune Manufacturing Plant", "Pune", "Maharashtra", "Ravi Patil"),
        ("PLT-002", "CUST-001", "Nashik Component Plant", "Nashik", "Maharashtra", "Meera Shah"),
        ("PLT-003", "CUST-002", "Mumbai Assembly Plant", "Mumbai", "Maharashtra", "Arun Nair"),
        ("PLT-004", "CUST-002", "Pune Powertrain Plant", "Pune", "Maharashtra", "Sanjay More"),
        ("PLT-005", "CUST-003", "Ahmedabad Production Plant", "Ahmedabad", "Gujarat", "Rina Patel"),
        ("PLT-006", "CUST-004", "Hazira Process Plant", "Surat", "Gujarat", "Dev Iyer"),
        ("PLT-007", "CUST-005", "Pimpri Automation Plant", "Pune", "Maharashtra", "Nitin Joshi"),
        ("PLT-008", "CUST-006", "Bengaluru Components Plant", "Bengaluru", "Karnataka", "Anita Rao"),
    ]

    plants = {}
    for code, customer_code, name, city, state, contact in plant_specs:
        plants[code], _ = get_or_create(
            db, Plant,
            {"plant_code": code},
            {
                "customer_id": customers[customer_code].id,
                "name": name,
                "address": f"{name}, Industrial Zone",
                "city": city,
                "state": state,
                "country": "India",
                "contact_name": contact,
                "contact_email": f"{contact.lower().replace(' ', '.')}@example.local",
                "contact_phone": "+91 90000 10000",
                "is_active": True,
            },
        )

    machine_specs = [
        ("MCH-001", "PLT-001", "CNC Machining Center 01", "DMU-50", "SER-TATA-001", "DMG MORI"),
        ("MCH-002", "PLT-001", "CNC Machining Center 02", "NHX-4000", "SER-TATA-002", "DMG MORI"),
        ("MCH-003", "PLT-001", "Air Compressor 01", "GA-90", "SER-TATA-003", "Atlas Copco"),
        ("MCH-004", "PLT-002", "Hydraulic Press 01", "HP-500", "SER-TATA-004", "Schuler"),
        ("MCH-005", "PLT-002", "Conveyor Line 01", "CV-120", "SER-TATA-005", "FlexLink"),
        ("MCH-006", "PLT-003", "Assembly Robot 01", "IRB-2600", "SER-MAH-001", "ABB"),
        ("MCH-007", "PLT-003", "Paint Booth 01", "PB-300", "SER-MAH-002", "Dürr"),
        ("MCH-008", "PLT-004", "Engine Test Bench 01", "ETB-800", "SER-MAH-003", "AVL"),
        ("MCH-009", "PLT-005", "Injection Molding Machine 01", "IM-450", "SER-ABC-001", "Husky"),
        ("MCH-010", "PLT-005", "Cooling Tower Pump 01", "CTP-80", "SER-ABC-002", "Kirloskar"),
        ("MCH-011", "PLT-006", "Process Pump 01", "P-250", "SER-REL-001", "Flowserve"),
        ("MCH-012", "PLT-006", "Heat Exchanger 01", "HX-900", "SER-REL-002", "Alfa Laval"),
        ("MCH-013", "PLT-007", "Servo Press 01", "SP-300", "SER-KIR-001", "FANUC"),
        ("MCH-014", "PLT-007", "PLC Control Panel 01", "S7-1500", "SER-KIR-002", "Siemens"),
        ("MCH-015", "PLT-008", "Industrial Generator 01", "DG-500", "SER-BHC-001", "Cummins"),
        ("MCH-016", "PLT-008", "Hydraulic Power Unit 01", "HPU-150", "SER-BHC-002", "Bosch Rexroth"),
    ]

    machines = {}
    for code, plant_code, name, model, serial, manufacturer in machine_specs:
        machines[code], _ = get_or_create(
            db, Machine,
            {"machine_code": code},
            {
                "plant_id": plants[plant_code].id,
                "name": name,
                "model": model,
                "serial_number": serial,
                "manufacturer": manufacturer,
                "installation_date": date(2024, 1, 15),
                "status": "ACTIVE",
                "warranty_expiry": date(2027, 1, 15),
                "is_active": True,
            },
        )

    db.flush()
    return customers, plants, machines


# ---------------------------------------------------------------------------
# Spare parts -> inventory -> stock movements
# ---------------------------------------------------------------------------

def seed_spares(db: Session, users):
    specs = [
        ("SP-001", "Deep Groove Bearing", "SKF", "Bearings", 10, 32),
        ("SP-002", "Hydraulic Pump", "Bosch Rexroth", "Hydraulics", 3, 7),
        ("SP-003", "Pressure Sensor", "WIKA", "Sensors", 8, 18),
        ("SP-004", "Temperature Sensor", "Siemens", "Sensors", 8, 22),
        ("SP-005", "Servo Motor", "Mitsubishi", "Motors", 4, 9),
        ("SP-006", "Motor Coupling", "Lovejoy", "Mechanical", 6, 14),
        ("SP-007", "Drive Belt", "Gates", "Belts", 10, 28),
        ("SP-008", "Oil Filter", "Donaldson", "Filters", 15, 48),
        ("SP-009", "Air Filter", "Mann+Hummel", "Filters", 12, 35),
        ("SP-010", "PLC CPU Module", "Siemens", "Automation", 2, 4),
        ("SP-011", "Contactor", "Schneider Electric", "Electrical", 8, 19),
        ("SP-012", "Relay", "Omron", "Electrical", 12, 26),
        ("SP-013", "Fuse 10A", "ABB", "Electrical", 20, 60),
        ("SP-014", "Cooling Fan", "ebm-papst", "Cooling", 5, 11),
        ("SP-015", "Solenoid Valve", "Festo", "Pneumatics", 4, 9),
        ("SP-016", "Hydraulic Seal Kit", "Parker", "Hydraulics", 5, 12),
        ("SP-017", "Proximity Sensor", "Pepperl+Fuchs", "Sensors", 8, 3),
        ("SP-018", "Vibration Sensor", "IFM", "Sensors", 4, 6),
    ]

    parts = {}
    inventory_user = users["EMP006"]

    for code, name, manufacturer, category, minimum_stock, quantity in specs:
        part, _ = get_or_create(
            db, SparePart,
            {"part_code": code},
            {
                "name": name,
                "description": f"{name} used in service and maintenance operations.",
                "manufacturer": manufacturer,
                "category": category,
                "unit": "PCS",
                "minimum_stock": minimum_stock,
                "is_active": True,
            },
        )
        parts[code] = part

        inv, created = get_or_create(
            db, Inventory,
            {"spare_part_id": part.id, "location": "MAIN"},
            {"quantity": quantity},
        )

        if created:
            movement = StockMovement(
                spare_part_id=part.id,
                movement_type="RECEIPT",
                quantity=quantity,
                location="MAIN",
                reference=f"SEED-{code}",
                notes="Initial development inventory receipt.",
                created_by_id=inventory_user.id,
                created_at=datetime.utcnow() - timedelta(days=20),
            )
            db.add(movement)

    db.flush()
    return parts


# ---------------------------------------------------------------------------
# Tickets, history, comments, mentions, notifications and part usage
# ---------------------------------------------------------------------------

def seed_tickets(
    db: Session,
    customers,
    plants,
    machines,
    departments,
    sub_departments,
    users,
    parts,
):
    ticket_specs = [
        ("TKT-1001", "CUST-001", "PLT-001", "MCH-001",
         "CNC spindle vibration detected", "Abnormal vibration observed during high-speed spindle operation.",
         "HIGH", "IN_PROGRESS", "EMP003"),
        ("TKT-1002", "CUST-001", "PLT-001", "MCH-003",
         "Compressor pressure drop", "Compressor pressure falls below operating range after 30 minutes.",
         "MEDIUM", "ASSIGNED", "EMP004"),
        ("TKT-1003", "CUST-001", "PLT-002", "MCH-004",
         "Hydraulic oil leakage", "Oil is leaking near the main hydraulic cylinder seal.",
         "CRITICAL", "CLOSE_REQUESTED", "EMP003"),
        ("TKT-1004", "CUST-002", "PLT-003", "MCH-006",
         "Robot axis calibration error", "Robot reports calibration deviation on axis 4.",
         "HIGH", "OPEN", None),
        ("TKT-1005", "CUST-002", "PLT-003", "MCH-007",
         "Paint booth airflow alarm", "Airflow alarm triggers intermittently during production.",
         "MEDIUM", "RESOLVED", "EMP005"),
        ("TKT-1006", "CUST-002", "PLT-004", "MCH-008",
         "Test bench temperature warning", "Temperature rises above configured threshold during endurance test.",
         "HIGH", "IN_PROGRESS", "EMP004"),
        ("TKT-1007", "CUST-003", "PLT-005", "MCH-009",
         "Injection molding cycle instability", "Cycle time varies significantly between production batches.",
         "HIGH", "ASSIGNED", "EMP003"),
        ("TKT-1008", "CUST-003", "PLT-005", "MCH-010",
         "Cooling pump low flow", "Cooling pump flow is below expected value.",
         "CRITICAL", "OPEN", None),
        ("TKT-1009", "CUST-004", "PLT-006", "MCH-011",
         "Process pump bearing noise", "Bearing noise detected during routine inspection.",
         "MEDIUM", "RESOLVED", "EMP005"),
        ("TKT-1010", "CUST-004", "PLT-006", "MCH-012",
         "Heat exchanger efficiency reduced", "Outlet temperature indicates reduced heat transfer efficiency.",
         "MEDIUM", "IN_PROGRESS", "EMP004"),
        ("TKT-1011", "CUST-005", "PLT-007", "MCH-013",
         "Servo press positioning drift", "Press position drifts after extended operation.",
         "HIGH", "CLOSED", "EMP003"),
        ("TKT-1012", "CUST-005", "PLT-007", "MCH-014",
         "PLC communication fault", "PLC intermittently loses communication with remote I/O.",
         "CRITICAL", "ASSIGNED", "EMP004"),
        ("TKT-1013", "CUST-006", "PLT-008", "MCH-015",
         "Generator battery warning", "Generator controller reports low battery voltage.",
         "LOW", "OPEN", None),
        ("TKT-1014", "CUST-006", "PLT-008", "MCH-016",
         "Hydraulic unit pressure fluctuation", "Hydraulic pressure fluctuates under load.",
         "HIGH", "IN_PROGRESS", "EMP003"),
    ]

    engineer_codes = ["EMP003", "EMP004", "EMP005"]
    service_manager = users["EMP002"]
    created_by = users["EMP002"]

    tickets = {}
    now = datetime.utcnow()

    for index, spec in enumerate(ticket_specs):
        (
            number, customer_code, plant_code, machine_code, title, description,
            priority, status, assigned_code,
        ) = spec

        ticket, created = get_or_create(
            db, ServiceTicket,
            {"ticket_number": number},
            {
                "customer_id": customers[customer_code].id,
                "plant_id": plants[plant_code].id,
                "machine_id": machines[machine_code].id,
                "department_id": departments["Service"].id,
                "sub_department_id": sub_departments["Field Service"].id,
                "created_by_id": created_by.id,
                "assigned_to_id": users[assigned_code].id if assigned_code else None,
                "title": title,
                "description": description,
                "priority": priority,
                "status": status,
                "resolution": (
                    "Issue investigated and corrective maintenance completed."
                    if status in {"RESOLVED", "CLOSED", "CLOSE_REQUESTED"}
                    else None
                ),
                "close_requested_by_id": (
                    users[assigned_code].id
                    if status == "CLOSE_REQUESTED" and assigned_code
                    else None
                ),
                "close_requested_at": (
                    now - timedelta(days=1)
                    if status == "CLOSE_REQUESTED"
                    else None
                ),
                "closed_at": (
                    now - timedelta(days=2)
                    if status == "CLOSED"
                    else None
                ),
                "created_at": now - timedelta(days=14 - (index % 10)),
                "updated_at": now - timedelta(hours=index),
            },
        )
        tickets[number] = ticket

        if not created:
            continue

        created_at = ticket.created_at
        add_history(
            db, ticket, created_by, "CREATED",
            f"Ticket {ticket.ticket_number} was created.",
            created_at=created_at,
        )

        if assigned_code:
            engineer = users[assigned_code]
            add_history(
                db, ticket, service_manager, "ASSIGNED",
                f"Ticket assigned to {engineer.first_name} {engineer.last_name}.",
                field_name="assigned_to_id",
                new_value=str(engineer.id),
                created_at=created_at + timedelta(hours=2),
            )

        if status in {"IN_PROGRESS", "RESOLVED", "CLOSE_REQUESTED", "CLOSED"}:
            add_history(
                db, ticket, users[assigned_code] if assigned_code else service_manager,
                "STATUS_CHANGED",
                f"Ticket status changed to {status}.",
                field_name="status",
                old_value="ASSIGNED" if assigned_code else "OPEN",
                new_value=status,
                created_at=created_at + timedelta(days=1),
            )

        if status in {"RESOLVED", "CLOSE_REQUESTED", "CLOSED"}:
            add_history(
                db, ticket, users[assigned_code] if assigned_code else service_manager,
                "RESOLVED",
                "Engineer recorded the service resolution.",
                field_name="status",
                new_value="RESOLVED",
                created_at=created_at + timedelta(days=2),
            )

        if status == "CLOSE_REQUESTED":
            add_history(
                db, ticket, users[assigned_code],
                "CLOSE_REQUESTED",
                "Closure requested from the reporting manager.",
                created_at=now - timedelta(days=1),
            )

        if status == "CLOSED":
            add_history(
                db, ticket, service_manager,
                "CLOSED",
                "Reporting manager approved ticket closure.",
                field_name="status",
                old_value="CLOSE_REQUESTED",
                new_value="CLOSED",
                created_at=now - timedelta(days=2),
            )

        engineer = users[assigned_code] if assigned_code else users[engineer_codes[index % len(engineer_codes)]]

        comment_1 = add_comment(
            db, ticket, engineer,
            f"Initial inspection completed. I am checking the {machines[machine_code].name.lower()} and will update the ticket.",
            created_at + timedelta(hours=4),
        )

        comment_2_text = (
            f"@{service_manager.first_name} {service_manager.last_name} "
            "please review the service findings and recommended action."
        )
        comment_2 = add_comment(
            db, ticket, engineer,
            comment_2_text,
            created_at + timedelta(hours=10),
        )

        mention_exists = (
            db.query(TicketCommentMention)
            .filter(
                TicketCommentMention.comment_id == comment_2.id,
                TicketCommentMention.mentioned_user_id == service_manager.id,
            )
            .first()
        )
        if not mention_exists:
            db.add(TicketCommentMention(
                comment_id=comment_2.id,
                mentioned_user_id=service_manager.id,
                created_at=created_at + timedelta(hours=10),
            ))

        add_notification(
            db, service_manager, ticket, "TICKET_MENTION",
            "You Were Mentioned",
            f"You were mentioned in {ticket.ticket_number}.",
            created_at + timedelta(hours=10),
        )

        if assigned_code:
            add_notification(
                db, assigned_code and users[assigned_code] or service_manager,
                ticket, "TICKET_COMMENT",
                "New Ticket Comment",
                f"A new comment was added to {ticket.ticket_number}.",
                created_at + timedelta(hours=4),
            )

        if status == "CLOSE_REQUESTED":
            add_notification(
                db, service_manager, ticket, "CLOSE_REQUEST",
                "Ticket Closure Requested",
                f"Closure approval is requested for {ticket.ticket_number}.",
                now - timedelta(days=1),
            )

        # Two representative consumed parts on selected tickets.
        if number in {"TKT-1001", "TKT-1003", "TKT-1009", "TKT-1011", "TKT-1014"}:
            part_code = {
                "TKT-1001": "SP-001",
                "TKT-1003": "SP-016",
                "TKT-1009": "SP-001",
                "TKT-1011": "SP-005",
                "TKT-1014": "SP-002",
            }[number]
            part = parts[part_code]
            qty = 2 if part_code == "SP-001" else 1

            inventory = (
                db.query(Inventory)
                .filter(
                    Inventory.spare_part_id == part.id,
                    Inventory.location == "MAIN",
                )
                .first()
            )
            if inventory and inventory.quantity >= qty:
                inventory.quantity -= qty

                movement = StockMovement(
                    spare_part_id=part.id,
                    movement_type="ISSUE",
                    quantity=qty,
                    location="MAIN",
                    reference=number,
                    notes=f"Consumed on service ticket {number}.",
                    created_by_id=engineer.id,
                    created_at=ticket.created_at + timedelta(days=2),
                )
                db.add(movement)
                db.flush()

                db.add(TicketSparePart(
                    ticket_id=ticket.id,
                    spare_part_id=part.id,
                    location="MAIN",
                    quantity=qty,
                    stock_movement_id=movement.id,
                    created_by_id=engineer.id,
                    notes="Seeded service consumption record.",
                    created_at=ticket.created_at + timedelta(days=2),
                ))

    db.flush()
    return tickets


def seed_extra_activity(db: Session, tickets, users):
    # A small amount of varied activity makes the dashboard useful immediately.
    now = datetime.utcnow()
    activities = [
        ("TKT-1004", users["EMP003"], "TICKET_ASSIGNED",
         "Ticket assigned to Rahul Patil."),
        ("TKT-1008", users["EMP002"], "TICKET_CREATED",
         "Critical cooling pump ticket created."),
        ("TKT-1012", users["EMP004"], "STATUS_CHANGED",
         "PLC communication ticket moved to Assigned."),
    ]

    for ticket_number, user, action, description in activities:
        ticket = tickets[ticket_number]
        add_history(
            db, ticket, user, action, description,
            created_at=now - timedelta(hours=6),
        )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def seed():
    db = SessionLocal()

    try:
        print("Starting ServiOps development seed...")

        permissions, roles, departments, sub_departments = seed_reference_data(db)
        users = seed_users(db, departments, sub_departments, roles)
        customers, plants, machines = seed_assets(db)
        parts = seed_spares(db, users)
        tickets = seed_tickets(
            db,
            customers,
            plants,
            machines,
            departments,
            sub_departments,
            users,
            parts,
        )
        seed_extra_activity(db, tickets, users)

        db.commit()

        counts = {
            "departments": db.query(Department).count(),
            "sub_departments": db.query(SubDepartment).count(),
            "roles": db.query(Role).count(),
            "permissions": db.query(Permission).count(),
            "users": db.query(User).count(),
            "customers": db.query(Customer).count(),
            "plants": db.query(Plant).count(),
            "machines": db.query(Machine).count(),
            "tickets": db.query(ServiceTicket).count(),
            "comments": db.query(TicketComment).count(),
            "mentions": db.query(TicketCommentMention).count(),
            "notifications": db.query(Notification).count(),
            "spare_parts": db.query(SparePart).count(),
            "inventory": db.query(Inventory).count(),
            "stock_movements": db.query(StockMovement).count(),
            "ticket_spare_parts": db.query(TicketSparePart).count(),
            "ticket_history": db.query(TicketHistory).count(),
        }

        print("\nServiOps development seed completed.")
        for key, value in counts.items():
            print(f"  {key:20} {value}")

        print("\nSeeded demo users are database users only.")
        print("They do not create Cognito accounts or passwords.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

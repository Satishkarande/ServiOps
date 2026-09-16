from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db

from app.models.customer import Customer
from app.models.machine import Machine
from app.models.plant import Plant
from app.models.service_ticket import ServiceTicket
from app.models.user import User
from app.models.role import Role


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_dashboard")
    ),
):

    # ========================================================
    # BASIC COUNTS
    # ========================================================

    active_customers = (
        db.query(
            func.count(Customer.id)
        )
        .filter(
            Customer.is_active.is_(True)
        )
        .scalar()
        or 0
    )


    active_plants = (
        db.query(
            func.count(Plant.id)
        )
        .filter(
            Plant.is_active.is_(True)
        )
        .scalar()
        or 0
    )


    active_machines = (
        db.query(
            func.count(Machine.id)
        )
        .filter(
            Machine.is_active.is_(True)
        )
        .scalar()
        or 0
    )


    total_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .scalar()
        or 0
    )


    # ========================================================
    # TICKET STATUS COUNTS
    # ========================================================

    open_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.status == "OPEN"
        )
        .scalar()
        or 0
    )


    assigned_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.status == "ASSIGNED"
        )
        .scalar()
        or 0
    )


    in_progress_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.status == "IN_PROGRESS"
        )
        .scalar()
        or 0
    )


    resolved_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.status == "RESOLVED"
        )
        .scalar()
        or 0
    )


    close_requested_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.status == "CLOSE_REQUESTED"
        )
        .scalar()
        or 0
    )


    closed_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.status == "CLOSED"
        )
        .scalar()
        or 0
    )


    cancelled_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.status == "CANCELLED"
        )
        .scalar()
        or 0
    )


    # ========================================================
    # PRIORITY COUNTS
    # ========================================================

    low_priority = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.priority == "LOW"
        )
        .scalar()
        or 0
    )


    medium_priority = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.priority == "MEDIUM"
        )
        .scalar()
        or 0
    )


    high_priority = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.priority == "HIGH"
        )
        .scalar()
        or 0
    )


    # ========================================================
    # HIGH PRIORITY ACTIVE
    # ========================================================

    high_priority_active = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.priority == "HIGH",
            ServiceTicket.status.notin_(
                [
                    "CLOSED",
                    "CANCELLED",
                ]
            ),
        )
        .scalar()
        or 0
    )


    # ========================================================
    # CURRENT USER TICKETS
    # ========================================================

    my_assigned_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.assigned_to_id
            == current_user.id,

            ServiceTicket.status.notin_(
                [
                    "CLOSED",
                    "CANCELLED",
                ]
            ),
        )
        .scalar()
        or 0
    )


    my_open_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.assigned_to_id
            == current_user.id,

            ServiceTicket.status == "OPEN",
        )
        .scalar()
        or 0
    )


    my_in_progress_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.assigned_to_id
            == current_user.id,

            ServiceTicket.status
            == "IN_PROGRESS",
        )
        .scalar()
        or 0
    )


    my_close_requested_tickets = (
        db.query(
            func.count(ServiceTicket.id)
        )
        .filter(
            ServiceTicket.assigned_to_id
            == current_user.id,

            ServiceTicket.status
            == "CLOSE_REQUESTED",
        )
        .scalar()
        or 0
    )


    # ========================================================
    # ACTIVE TICKET AGING
    #
    # Over 3 days = overdue for dashboard purposes.
    # CLOSED and CANCELLED tickets are excluded.
    # ========================================================

    now = datetime.now()


    active_ticket_rows = (
        db.query(
            ServiceTicket
        )
        .filter(
            ServiceTicket.status.notin_(
                [
                    "CLOSED",
                    "CANCELLED",
                ]
            )
        )
        .all()
    )


    aging_under_one_day = 0

    aging_one_to_three_days = 0

    aging_over_three_days = 0

    my_overdue_tickets = 0


    for ticket in active_ticket_rows:

        if not ticket.created_at:
            continue


        age = (
            now -
            ticket.created_at
        )


        age_days = (
            age.total_seconds()
            / 86400
        )


        if age_days < 1:

            aging_under_one_day += 1


        elif age_days < 3:

            aging_one_to_three_days += 1


        else:

            aging_over_three_days += 1


            if (
                ticket.assigned_to_id
                == current_user.id
            ):

                my_overdue_tickets += 1


    # ========================================================
    # STATUS DISTRIBUTION
    # ========================================================

    status_results = (
        db.query(
            ServiceTicket.status,
            func.count(
                ServiceTicket.id
            ).label("count"),
        )
        .group_by(
            ServiceTicket.status
        )
        .all()
    )


    status_distribution = [

        {
            "status":
                ticket_status,

            "count":
                count,
        }

        for ticket_status, count
        in status_results

    ]


    # ========================================================
    # PRIORITY DISTRIBUTION
    # ========================================================

    priority_results = (
        db.query(
            ServiceTicket.priority,
            func.count(
                ServiceTicket.id
            ).label("count"),
        )
        .group_by(
            ServiceTicket.priority
        )
        .all()
    )


    priority_distribution = [

        {
            "priority":
                priority,

            "count":
                count,
        }

        for priority, count
        in priority_results

    ]


    # ========================================================
    # ENGINEER WORKLOAD
    # ========================================================

    engineers = (
        db.query(User)
        .join(
            Role,
            User.role_id == Role.id,
        )
        .filter(
            User.is_active.is_(True),

            Role.name ==
                "Service Engineer",

            Role.is_active.is_(True),
        )
        .order_by(
            User.first_name,
            User.last_name,
        )
        .all()
    )


    engineer_workload = []


    for engineer in engineers:

        ticket_count = (
            db.query(
                func.count(
                    ServiceTicket.id
                )
            )
            .filter(

                ServiceTicket.assigned_to_id
                == engineer.id,

                ServiceTicket.status.notin_(
                    [
                        "CLOSED",
                        "CANCELLED",
                    ]
                ),
            )
            .scalar()
            or 0
        )


        engineer_workload.append(
            {
                "id":
                    engineer.id,

                "employee_code":
                    engineer.employee_code,

                "name":
                    (
                        f"{engineer.first_name} "
                        f"{engineer.last_name}"
                    ),

                "count":
                    ticket_count,
            }
        )


    engineer_workload.sort(
        key=lambda item:
            item["count"],
        reverse=True,
    )


    engineer_workload = engineer_workload[:8]


    # ========================================================
    # RECENT TICKETS
    # ========================================================

    recent_tickets = (
        db.query(
            ServiceTicket
        )
        .order_by(
            ServiceTicket.created_at.desc()
        )
        .limit(8)
        .all()
    )


    recent_ticket_data = []


    for ticket in recent_tickets:

        recent_ticket_data.append(
            {
                "id":
                    ticket.id,

                "ticket_number":
                    ticket.ticket_number,

                "title":
                    ticket.title,

                "priority":
                    ticket.priority,

                "status":
                    ticket.status,

                "created_at":
                    ticket.created_at,
            }
        )


    # ========================================================
    # 30 DAY TICKET TREND
    # ========================================================

    today = now.date()


    start_date = (
        today -
        timedelta(days=29)
    )


    trend_tickets = (
        db.query(
            ServiceTicket
        )
        .filter(
            ServiceTicket.created_at
            >= datetime.combine(
                start_date,
                datetime.min.time(),
            )
        )
        .order_by(
            ServiceTicket.created_at.asc()
        )
        .all()
    )


    trend = {}


    for index in range(30):

        day = (
            start_date +
            timedelta(days=index)
        )


        trend[str(day)] = {

            "date":
                str(day),

            "created":
                0,

            "closed":
                0,

        }


    for ticket in trend_tickets:

        if ticket.created_at:

            created_day = str(
                ticket.created_at.date()
            )


            if created_day in trend:

                trend[
                    created_day
                ]["created"] += 1


        if (
            ticket.closed_at
            and
            ticket.closed_at.date()
            >= start_date
        ):

            closed_day = str(
                ticket.closed_at.date()
            )


            if closed_day in trend:

                trend[
                    closed_day
                ]["closed"] += 1


    ticket_trend = list(
        trend.values()
    )


    # ========================================================
    # RETURN DASHBOARD DATA
    # ========================================================

    return {

        "customers": {

            "active":
                active_customers,

        },


        "plants": {

            "active":
                active_plants,

        },


        "machines": {

            "active":
                active_machines,

        },


        "tickets": {

            "total":
                total_tickets,

            "open":
                open_tickets,

            "assigned":
                assigned_tickets,

            "in_progress":
                in_progress_tickets,

            "resolved":
                resolved_tickets,

            "close_requested":
                close_requested_tickets,

            "closed":
                closed_tickets,

            "cancelled":
                cancelled_tickets,

            "high_priority_active":
                high_priority_active,

            # NEW
            "overdue":
                aging_over_three_days,

        },


        "priority": {

            "low":
                low_priority,

            "medium":
                medium_priority,

            "high":
                high_priority,

        },


        "status_distribution":
            status_distribution,


        "priority_distribution":
            priority_distribution,


        "my_tickets": {

            "total":
                my_assigned_tickets,

            "open":
                my_open_tickets,

            "in_progress":
                my_in_progress_tickets,

            "close_requested":
                my_close_requested_tickets,

            # NEW
            "overdue":
                my_overdue_tickets,

        },


        "engineer_workload":
            engineer_workload,


        "recent_tickets":
            recent_ticket_data,


        "ticket_aging": {

            "under_1_day":
                aging_under_one_day,

            "one_to_three_days":
                aging_one_to_three_days,

            "over_3_days":
                aging_over_three_days,

        },


        "ticket_trend":
            ticket_trend,

    }


# ============================================================
# TICKETS BY PRIORITY
# ============================================================

@router.get(
    "/tickets-by-priority"
)
def tickets_by_priority(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "view_dashboard"
        )
    ),
):

    results = (
        db.query(
            ServiceTicket.priority,
            func.count(
                ServiceTicket.id
            ).label("count"),
        )
        .group_by(
            ServiceTicket.priority
        )
        .order_by(
            ServiceTicket.priority
        )
        .all()
    )


    return [

        {
            "priority":
                priority,

            "count":
                count,
        }

        for priority, count
        in results

    ]


# ============================================================
# TICKETS BY STATUS
# ============================================================

@router.get(
    "/tickets-by-status"
)
def tickets_by_status(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "view_dashboard"
        )
    ),
):

    results = (
        db.query(
            ServiceTicket.status,
            func.count(
                ServiceTicket.id
            ).label("count"),
        )
        .group_by(
            ServiceTicket.status
        )
        .order_by(
            ServiceTicket.status
        )
        .all()
    )


    return [

        {
            "status":
                ticket_status,

            "count":
                count,
        }

        for ticket_status, count
        in results

    ]
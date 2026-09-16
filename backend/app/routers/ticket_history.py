from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.service_ticket import ServiceTicket
from app.models.ticket_history import TicketHistory
from app.models.user import User
from app.schemas.ticket_history import TicketHistoryResponse


router = APIRouter(
    prefix="/tickets",
    tags=["Ticket History"],
)


@router.get(
    "/{ticket_id}/history",
    response_model=list[TicketHistoryResponse],
)
def get_ticket_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("view_ticket")
    ),
):
    # --------------------------------------------------------
    # Validate ticket
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
            detail="Ticket not found",
        )


    # --------------------------------------------------------
    # Fetch audit records
    # --------------------------------------------------------

    history = (
        db.query(TicketHistory)
        .filter(
            TicketHistory.ticket_id == ticket_id
        )
        .order_by(
            TicketHistory.created_at.desc(),
            TicketHistory.id.desc(),
        )
        .all()
    )


    # --------------------------------------------------------
    # Build response with actor information
    #
    # The existing TicketHistory table stores changed_by_id.
    # We keep that database structure unchanged and enrich
    # the API response with the corresponding User.
    # --------------------------------------------------------

    response = []


    # Small per-request cache so repeated history records
    # for the same user do not require repeated DB queries.
    user_cache = {}


    for item in history:

        changed_by = None


        if item.changed_by_id is not None:

            changed_by_id = int(
                item.changed_by_id
            )


            if changed_by_id not in user_cache:

                user_cache[changed_by_id] = (
                    db.query(User)
                    .filter(
                        User.id == changed_by_id
                    )
                    .first()
                )


            user = user_cache[changed_by_id]


            if user is not None:

                changed_by = {
                    "id": user.id,

                    "employee_code":
                        user.employee_code,

                    "first_name":
                        user.first_name,

                    "last_name":
                        user.last_name,

                    "email":
                        user.email,

                    "role":
                        user.role.name
                        if user.role
                        else None,
                }


        response.append(
            {
                "id": item.id,

                "ticket_id":
                    item.ticket_id,

                "changed_by_id":
                    item.changed_by_id,

                "action":
                    item.action,

                "field_name":
                    item.field_name,

                "old_value":
                    item.old_value,

                "new_value":
                    item.new_value,

                "description":
                    item.description,

                "created_at":
                    item.created_at,

                "changed_by":
                    changed_by,
            }
        )


    return response

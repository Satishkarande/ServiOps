from sqlalchemy.orm import Session

from app.models.ticket_history import TicketHistory


def record_ticket_history(
    db: Session,
    ticket_id: int,
    changed_by_id: int,
    action: str,
    field_name: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    description: str | None = None,
) -> TicketHistory:

    history = TicketHistory(
        ticket_id=ticket_id,
        changed_by_id=changed_by_id,
        action=action,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        description=description,
    )

    db.add(history)

    return history
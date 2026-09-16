from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import require_permission, user_has_permission
from app.dependencies import get_db
from app.models.service_ticket import ServiceTicket
from app.models.spare_part import SparePart
from app.models.ticket_spare_part import TicketSparePart
from app.schemas.stock_movement import StockMovementType
from app.schemas.ticket_spare_part import TicketSparePartCreate, TicketSparePartResponse
from app.services.inventory_service import create_stock_movement_in_transaction
from app.services.ticket_history_service import record_ticket_history
from app.routers.service_tickets import MATERIAL_CONSUMPTION_STATUSES

router = APIRouter(prefix="/tickets", tags=["Ticket Spare Parts"])


def _ticket_or_404(db: Session, ticket_id: int) -> ServiceTicket:
    ticket = db.query(ServiceTicket).filter(ServiceTicket.id == ticket_id).one_or_none()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket


@router.get("/{ticket_id}/spare-parts", response_model=list[TicketSparePartResponse])
def get_ticket_spare_parts(ticket_id: int, db: Session = Depends(get_db), current_user=Depends(require_permission("view_ticket"))):
    _ticket_or_404(db, ticket_id)
    return (db.query(TicketSparePart).options(joinedload(TicketSparePart.spare_part), joinedload(TicketSparePart.created_by), joinedload(TicketSparePart.stock_movement)).filter(TicketSparePart.ticket_id == ticket_id).order_by(TicketSparePart.created_at.desc(), TicketSparePart.id.desc()).all())


@router.post("/{ticket_id}/spare-parts", response_model=TicketSparePartResponse, status_code=status.HTTP_201_CREATED)
def consume_ticket_spare_part(ticket_id: int, data: TicketSparePartCreate, db: Session = Depends(get_db), current_user=Depends(require_permission("consume_ticket_spare"))):
    if not user_has_permission(current_user, "view_ticket"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission required: view_ticket")
    ticket = _ticket_or_404(db, ticket_id)
    if ticket.status not in MATERIAL_CONSUMPTION_STATUSES:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ticket status does not allow spare-part consumption")
    part = db.query(SparePart).filter(SparePart.id == data.spare_part_id, SparePart.is_active.is_(True)).one_or_none()
    if part is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spare part not found")
    try:
        movement = create_stock_movement_in_transaction(db, spare_part=part, movement_type=StockMovementType.ISSUE, quantity=data.quantity, location=data.location, created_by_id=current_user.id, reference=f"TICKET:{ticket.ticket_number}", notes=data.notes)
        usage = TicketSparePart(ticket_id=ticket.id, spare_part_id=part.id, location=movement.location, quantity=data.quantity, stock_movement_id=movement.id, created_by_id=current_user.id, notes=data.notes.strip() if data.notes else None)
        db.add(usage)
        record_ticket_history(db=db, ticket_id=ticket.id, changed_by_id=current_user.id, action="SPARE_PART_USED", field_name="spare_part", old_value=None, new_value=f"{part.part_code} x {data.quantity}", description=f"Used {data.quantity} {part.unit} of {part.part_code} ({part.name}) from {movement.location}")
        db.commit()
        db.refresh(usage)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    return (db.query(TicketSparePart).options(joinedload(TicketSparePart.spare_part), joinedload(TicketSparePart.created_by), joinedload(TicketSparePart.stock_movement)).filter(TicketSparePart.id == usage.id).one())

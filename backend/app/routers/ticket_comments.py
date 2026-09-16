from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.service_ticket import ServiceTicket
from app.models.ticket_comment import TicketComment
from app.models.ticket_comment_mentions import TicketCommentMention
from app.models.ticket_comment_attachment import TicketCommentAttachment
from app.models.user import User
from app.schemas.ticket_comment import (
    TicketCommentCreate,
    TicketCommentUpdate,
    TicketCommentResponse,
)
from app.services.notification_service import (
    create_notification,
)
from app.services.ticket_mention_service import (
    extract_mentioned_users,
)


router = APIRouter(
    prefix="/tickets",
    tags=["Ticket Comments"],
)


def build_comment_user_summary(
    user: User
):
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


def build_comment_response(
    comment: TicketComment
):
    return {
        "id": comment.id,
        "ticket_id": comment.ticket_id,
        "comment": comment.comment,
        "created_by": build_comment_user_summary(
            comment.created_by
        ),
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "attachments": [
            {
                "id": attachment.id,
                "comment_id": attachment.comment_id,
                "uploaded_by_id": attachment.uploaded_by_id,
                "file_name": attachment.file_name,
                "content_type": attachment.content_type,
                "file_size": attachment.file_size,
                "created_at": attachment.created_at,
            }
            for attachment in sorted(
                comment.attachments,
                key=lambda item: (item.created_at, item.id),
            )
        ],
    }


@router.get(
    "/{ticket_id}/comments",
    response_model=list[TicketCommentResponse],
)
def get_ticket_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("view_ticket")
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

    comments = (
        db.query(TicketComment)
        .filter(
            TicketComment.ticket_id == ticket_id
        )
        .order_by(
            TicketComment.created_at.desc(),
            TicketComment.id.desc(),
        )
        .all()
    )

    return [
        build_comment_response(comment)
        for comment in comments
    ]


@router.post(
    "/{ticket_id}/comments",
    response_model=TicketCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket_comment(
    ticket_id: int,
    comment_data: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("comment_ticket")
    ),
):
    comment_text = (
        comment_data.comment.strip()
    )

    if not comment_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment cannot be empty",
        )

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

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive users cannot add comments",
        )

    new_comment = TicketComment(
        ticket_id=ticket.id,
        created_by_id=current_user.id,
        comment=comment_text,
    )

    db.add(new_comment)

    # ------------------------------------------------------------
    # NORMAL COMMENT NOTIFICATIONS
    #
    # These remain independent from mention notifications.
    # A user can therefore receive both notifications when they
    # are already a ticket participant and are explicitly mentioned.
    # ------------------------------------------------------------

    notification_recipient_ids = set()

    if (
        ticket.created_by_id is not None
        and
        ticket.created_by_id != current_user.id
    ):
        notification_recipient_ids.add(
            ticket.created_by_id
        )

    if (
        ticket.assigned_to_id is not None
        and
        ticket.assigned_to_id != current_user.id
    ):
        notification_recipient_ids.add(
            ticket.assigned_to_id
        )

    if notification_recipient_ids:

        notification_users = (
            db.query(User)
            .filter(
                User.id.in_(
                    notification_recipient_ids
                ),
                User.is_active.is_(True),
            )
            .all()
        )

        commenter_name = (
            f"{current_user.first_name} "
            f"{current_user.last_name}"
        ).strip()

        if not commenter_name:
            commenter_name = current_user.email

        for user in notification_users:

            create_notification(
                db=db,
                user_id=user.id,
                notification_type="TICKET_COMMENT",
                title="New Ticket Comment",
                message=(
                    f"{commenter_name} "
                    f"commented on ticket "
                    f"{ticket.ticket_number}."
                ),
                ticket_id=ticket.id,
            )

    # ------------------------------------------------------------
    # @MENTIONS
    #
    # Mention notifications are independent from normal comment
    # notifications. If a mentioned user is also the ticket creator
    # or assigned engineer, they receive BOTH notifications.
    #
    # The same user is recorded only once for a single comment.
    # ------------------------------------------------------------

    mentioned_users = extract_mentioned_users(
        db=db,
        comment_text=comment_text,
    )

    if mentioned_users:

        # Flush first so the new comment has its database ID.
        db.flush()

        commenter_name = (
            f"{current_user.first_name} "
            f"{current_user.last_name}"
        ).strip()

        if not commenter_name:
            commenter_name = current_user.email

        for mentioned_user in mentioned_users:

            # Do not notify the commenter for mentioning themselves.
            # The mention record is also skipped in that case.
            if mentioned_user.id == current_user.id:
                continue

            mention = TicketCommentMention(
                comment_id=new_comment.id,
                mentioned_user_id=mentioned_user.id,
            )

            db.add(mention)

            create_notification(
                db=db,
                user_id=mentioned_user.id,
                notification_type="TICKET_MENTION",
                title="You Were Mentioned",
                message=(
                    f"{commenter_name} "
                    f"mentioned you in a comment on "
                    f"ticket {ticket.ticket_number}."
                ),
                ticket_id=ticket.id,
            )

    try:
        # Comment, normal comment notifications, mention records,
        # and mention notifications are committed together.
        db.commit()
        db.refresh(new_comment)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create ticket comment",
        )

    return build_comment_response(
        new_comment
    )


@router.patch(
    "/{ticket_id}/comments/{comment_id}",
    response_model=TicketCommentResponse,
)
def update_ticket_comment(
    ticket_id: int,
    comment_id: int,
    comment_data: TicketCommentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("comment_ticket")
    ),
):
    comment_text = (
        comment_data.comment.strip()
    )

    if not comment_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment cannot be empty",
        )

    comment = (
        db.query(TicketComment)
        .filter(
            TicketComment.id == comment_id,
            TicketComment.ticket_id == ticket_id,
        )
        .first()
    )

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive users cannot edit comments",
        )

    if comment.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments",
        )

    # ------------------------------------------------------------
    # @MENTIONS ON EDIT
    #
    # Rebuild the mention records from the edited text. Existing
    # mentions that remain in the comment are kept without sending
    # another notification. Newly added mentions receive a new
    # TICKET_MENTION notification. Removed mentions are removed from
    # the comment's mention records. Notifications already delivered
    # are intentionally not retracted.
    # ------------------------------------------------------------

    ticket = (
        db.query(ServiceTicket)
        .filter(ServiceTicket.id == ticket_id)
        .first()
    )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    old_mentioned_ids = {
        mention.mentioned_user_id
        for mention in comment.mentions
    }

    mentioned_users = extract_mentioned_users(
        db=db,
        comment_text=comment_text,
    )
    new_mentioned_users = [
        user
        for user in mentioned_users
        if user.id != current_user.id
    ]
    new_mentioned_ids = {
        user.id
        for user in new_mentioned_users
    }

    # Remove mention records for users no longer mentioned.
    for mention in list(comment.mentions):
        if mention.mentioned_user_id not in new_mentioned_ids:
            db.delete(mention)

    commenter_name = (
        f"{current_user.first_name} "
        f"{current_user.last_name}"
    ).strip()
    if not commenter_name:
        commenter_name = current_user.email

    # Notify only users who were not already mentioned in the
    # previous version of this comment.
    for mentioned_user in new_mentioned_users:
        if mentioned_user.id in old_mentioned_ids:
            continue

        db.add(
            TicketCommentMention(
                comment_id=comment.id,
                mentioned_user_id=mentioned_user.id,
            )
        )

        create_notification(
            db=db,
            user_id=mentioned_user.id,
            notification_type="TICKET_MENTION",
            title="You Were Mentioned",
            message=(
                f"{commenter_name} mentioned you in an edited comment "
                f"on ticket {ticket.ticket_number}."
            ),
            ticket_id=ticket.id,
        )

    comment.comment = comment_text

    try:
        db.commit()
        db.refresh(comment)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update ticket comment",
        )

    return build_comment_response(
        comment
    )

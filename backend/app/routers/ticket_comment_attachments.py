from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.dependencies import get_db
from app.models.ticket_comment import TicketComment
from app.models.ticket_comment_attachment import TicketCommentAttachment
from app.services.attachment_storage import (
    delete_file,
    generate_storage_key,
    get_storage_path,
    save_file,
    STORAGE_DIR,
)


router = APIRouter(prefix="/tickets", tags=["Ticket Comment Attachments"])

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

def get_comment_or_404(ticket_id: int, comment_id: int, db: Session):
    comment = (
        db.query(TicketComment)
        .filter(TicketComment.id == comment_id, TicketComment.ticket_id == ticket_id)
        .first()
    )
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.post(
    "/{ticket_id}/comments/{comment_id}/attachments",
    status_code=status.HTTP_201_CREATED,
)
async def add_comment_attachments(
    ticket_id: int,
    comment_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("comment_ticket")),
):
    comment = get_comment_or_404(ticket_id, comment_id, db)

    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive users cannot add attachments")

    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    created = []

    try:
        for upload in files:
            content_type = upload.content_type or "application/octet-stream"
            if content_type not in ALLOWED_CONTENT_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"File type is not allowed: {upload.filename or 'unnamed file'}",
                )

            original_name = Path(upload.filename or "attachment").name
            if not original_name:
                original_name = "attachment"

            data = await upload.read()
            if len(data) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File is too large: {original_name}. Maximum size is 10 MB.",
                )

            storage_key = generate_storage_key(comment.ticket_id, comment.id)
            storage_path = save_file(storage_key, data)

            attachment = TicketCommentAttachment(
                comment_id=comment.id,
                uploaded_by_id=current_user.id,
                file_name=original_name[:255],
                storage_key=storage_key,
                content_type=content_type,
                file_size=len(data),
            )
            db.add(attachment)
            created.append((attachment, storage_path))

        db.commit()
        for attachment, _ in created:
            db.refresh(attachment)

        return [
            {
                "id": attachment.id,
                "comment_id": attachment.comment_id,
                "uploaded_by_id": attachment.uploaded_by_id,
                "file_name": attachment.file_name,
                "content_type": attachment.content_type,
                "file_size": attachment.file_size,
                "created_at": attachment.created_at,
            }
            for attachment, _ in created
        ]

    except HTTPException:
        db.rollback()
        for _, storage_path in created:
            storage_path.unlink(missing_ok=True)
        raise
    except Exception:
        db.rollback()
        for _, storage_path in created:
            storage_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Unable to save attachment")
    finally:
        for upload in files:
            await upload.close()


@router.get(
    "/{ticket_id}/comments/{comment_id}/attachments/{attachment_id}",
)
def view_comment_attachment(
    ticket_id: int,
    comment_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("view_ticket")),
):
    get_comment_or_404(ticket_id, comment_id, db)

    attachment = (
        db.query(TicketCommentAttachment)
        .filter(
            TicketCommentAttachment.id == attachment_id,
            TicketCommentAttachment.comment_id == comment_id,
        )
        .first()
    )
    if attachment is None:
        raise HTTPException(status_code=404, detail="Attachment not found")

    path = get_storage_path(attachment.storage_key)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Attachment file not found")

    return FileResponse(
        path,
        media_type=attachment.content_type,
        filename=attachment.file_name,
        content_disposition_type="inline" if attachment.content_type.startswith("image/") or attachment.content_type == "application/pdf" else "attachment",
    )


@router.delete(
    "/{ticket_id}/comments/{comment_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment_attachment(
    ticket_id: int,
    comment_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("comment_ticket")),
):
    get_comment_or_404(ticket_id, comment_id, db)

    attachment = (
        db.query(TicketCommentAttachment)
        .filter(
            TicketCommentAttachment.id == attachment_id,
            TicketCommentAttachment.comment_id == comment_id,
        )
        .first()
    )
    if attachment is None:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive users cannot delete attachments")

    # Attachment deletion is intentionally permanent: remove both the file and DB row.
    delete_file(attachment.storage_key)
    db.delete(attachment)
    db.commit()
    return None

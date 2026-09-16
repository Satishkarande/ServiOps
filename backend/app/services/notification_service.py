from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    ticket_id: int | None = None,
) -> Notification:

    notification = Notification(
        user_id=user_id,
        ticket_id=ticket_id,
        type=notification_type,
        title=title,
        message=message,
        is_read=False,
    )

    db.add(notification)

    return notification


def notify_user(
    db: Session,
    user: User,
    notification_type: str,
    title: str,
    message: str,
    ticket_id: int | None = None,
) -> Notification:

    return create_notification(
        db=db,
        user_id=user.id,
        notification_type=notification_type,
        title=title,
        message=message,
        ticket_id=ticket_id,
    )


def notify_users(
    db: Session,
    users: list[User],
    notification_type: str,
    title: str,
    message: str,
    ticket_id: int | None = None,
) -> list[Notification]:

    notifications = []

    for user in users:

        notification = create_notification(
            db=db,
            user_id=user.id,
            notification_type=notification_type,
            title=title,
            message=message,
            ticket_id=ticket_id,
        )

        notifications.append(notification)

    return notifications
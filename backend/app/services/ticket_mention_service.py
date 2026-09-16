import re

from sqlalchemy.orm import Session

from app.models.user import User


MENTION_PATTERN = re.compile(
    r"@([A-Za-z0-9._-]+(?:\s+[A-Za-z0-9._-]+)*)"
)


def get_mentionable_users(
    db: Session,
) -> list[User]:
    return (
        db.query(User)
        .filter(
            User.is_active.is_(True)
        )
        .order_by(
            User.first_name,
            User.last_name,
        )
        .all()
    )


def extract_mentioned_users(
    db: Session,
    comment_text: str,
) -> list[User]:
    users = get_mentionable_users(db)

    exact_tokens = {}

    for user in users:
        full_name = (
            f"{user.first_name} "
            f"{user.last_name}"
        ).strip()

        if full_name:
            exact_tokens[
                full_name.casefold()
            ] = user

        exact_tokens[
            user.employee_code.casefold()
        ] = user

        exact_tokens[
            user.email.casefold()
        ] = user

    # Match the longest known user token first.
    # This allows the frontend to insert "@First Last"
    # while the backend still resolves it safely.
    candidates = sorted(
        exact_tokens.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    )

    mentioned_users = []
    mentioned_ids = set()

    for token, user in candidates:
        pattern = re.compile(
            rf"(?<![A-Za-z0-9._-])@"
            rf"{re.escape(token)}"
            rf"(?![A-Za-z0-9._-])",
            re.IGNORECASE,
        )

        if pattern.search(comment_text):
            if user.id not in mentioned_ids:
                mentioned_users.append(user)
                mentioned_ids.add(user.id)

    return mentioned_users

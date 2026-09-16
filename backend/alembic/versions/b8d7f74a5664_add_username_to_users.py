"""add username to users

Revision ID: b8d7f74a5664
Revises: 706b2057034b
Create Date: 2026-09-05 22:04:52.732482

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8d7f74a5664'
down_revision: Union[str, Sequence[str], None] = '706b2057034b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "username",
            sa.String(length=50),
            nullable=True,
        ),
    )

    op.execute(
        sa.text(
            "UPDATE users "
            "SET username = employee_code "
            "WHERE username IS NULL"
        )
    )

    op.alter_column(
        "users",
        "username",
        existing_type=sa.String(length=50),
        nullable=False,
    )

    op.create_unique_constraint(
        "uq_users_username",
        "users",
        ["username"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_users_username",
        "users",
        type_="unique",
    )

    op.drop_column(
        "users",
        "username",
    )

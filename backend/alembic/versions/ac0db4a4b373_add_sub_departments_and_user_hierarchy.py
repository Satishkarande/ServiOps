"""add sub departments and user hierarchy

Revision ID: ac0db4a4b373
Revises: e2b71c4d9f06
Create Date: 2026-09-04 12:16:18.802140

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ac0db4a4b373"
down_revision: Union[str, Sequence[str], None] = "e2b71c4d9f06"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "sub_departments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["department_id"],
            ["departments.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.add_column(
        "users",
        sa.Column(
            "sub_department_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "manager_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        None,
        "users",
        "users",
        ["manager_id"],
        ["id"],
    )

    op.create_foreign_key(
        None,
        "users",
        "sub_departments",
        ["sub_department_id"],
        ["id"],
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        None,
        "users",
        type_="foreignkey",
    )

    op.drop_constraint(
        None,
        "users",
        type_="foreignkey",
    )

    op.drop_column(
        "users",
        "manager_id",
    )

    op.drop_column(
        "users",
        "sub_department_id",
    )

    op.drop_table(
        "sub_departments",
    )
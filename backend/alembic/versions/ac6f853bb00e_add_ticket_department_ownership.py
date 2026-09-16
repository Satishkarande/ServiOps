"""add ticket department ownership

Revision ID: f4c8e91a7b26
Revises: ac0db4a4b373
"""

from alembic import op
import sqlalchemy as sa


# ============================================================
# REVISION IDENTIFIERS
# ============================================================

revision = "f4c8e91a7b26"

down_revision = "ac0db4a4b373"

branch_labels = None

depends_on = None


# ============================================================
# UPGRADE
# ============================================================

def upgrade() -> None:

    # --------------------------------------------------------
    # Add columns as nullable first.
    #
    # Existing tickets need values before we can enforce
    # NOT NULL.
    # --------------------------------------------------------

    op.add_column(
        "service_tickets",
        sa.Column(
            "department_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "service_tickets",
        sa.Column(
            "sub_department_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # --------------------------------------------------------
    # Foreign keys
    # --------------------------------------------------------

    op.create_foreign_key(
        "fk_service_tickets_department_id_departments",
        "service_tickets",
        "departments",
        ["department_id"],
        ["id"],
    )

    op.create_foreign_key(
        "fk_service_tickets_sub_department_id_sub_departments",
        "service_tickets",
        "sub_departments",
        ["sub_department_id"],
        ["id"],
    )

    # --------------------------------------------------------
    # Existing tickets
    #
    # We intentionally leave existing ticket ownership NULL
    # for now rather than inventing organizational ownership.
    #
    # New tickets will be required to provide both fields by
    # the API.
    # --------------------------------------------------------


# ============================================================
# DOWNGRADE
# ============================================================

def downgrade() -> None:

    op.drop_constraint(
        "fk_service_tickets_sub_department_id_sub_departments",
        "service_tickets",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_service_tickets_department_id_departments",
        "service_tickets",
        type_="foreignkey",
    )

    op.drop_column(
        "service_tickets",
        "sub_department_id",
    )

    op.drop_column(
        "service_tickets",
        "department_id",
    )
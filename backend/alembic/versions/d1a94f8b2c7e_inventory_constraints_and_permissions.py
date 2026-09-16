"""add inventory constraints and permissions

Revision ID: d1a94f8b2c7e
Revises: c8cbfc1d0937
Create Date: 2026-09-02
"""
from alembic import op


revision = "d1a94f8b2c7e"
down_revision = "c8cbfc1d0937"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_inventory_spare_part_location",
        "inventory",
        ["spare_part_id", "location"],
    )
    op.create_check_constraint(
        "ck_inventory_quantity_non_negative",
        "inventory",
        "quantity >= 0",
    )
    op.create_check_constraint(
        "ck_stock_movements_quantity_positive",
        "stock_movements",
        "quantity > 0",
    )
    op.create_check_constraint(
        "ck_stock_movements_type",
        "stock_movements",
        "movement_type IN ('RECEIPT', 'ISSUE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT')",
    )

    for name, description in (
        ("view_inventory", "View inventory balances and low-stock items"),
        ("manage_inventory", "Receive, issue, and adjust inventory"),
        ("view_stock_movement", "View stock movement history"),
    ):
        op.execute(
            "INSERT INTO permissions (name, description, is_active) "
            f"VALUES ('{name}', '{description}', true) "
            "ON CONFLICT (name) DO NOTHING"
        )


def downgrade() -> None:
    op.execute(
        "DELETE FROM permissions WHERE name IN "
        "('view_inventory', 'manage_inventory', 'view_stock_movement')"
    )
    op.drop_constraint("ck_stock_movements_type", "stock_movements", type_="check")
    op.drop_constraint("ck_stock_movements_quantity_positive", "stock_movements", type_="check")
    op.drop_constraint("ck_inventory_quantity_non_negative", "inventory", type_="check")
    op.drop_constraint("uq_inventory_spare_part_location", "inventory", type_="unique")

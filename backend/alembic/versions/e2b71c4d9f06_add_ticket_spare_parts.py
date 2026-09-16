"""add ticket spare parts

Revision ID: e2b71c4d9f06
Revises: d1a94f8b2c7e
"""
from alembic import op
import sqlalchemy as sa

revision = "e2b71c4d9f06"
down_revision = "d1a94f8b2c7e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("ticket_spare_parts", sa.Column("id", sa.Integer(), nullable=False), sa.Column("ticket_id", sa.Integer(), nullable=False), sa.Column("spare_part_id", sa.Integer(), nullable=False), sa.Column("location", sa.String(length=100), nullable=False), sa.Column("quantity", sa.Integer(), nullable=False), sa.Column("stock_movement_id", sa.Integer(), nullable=False), sa.Column("created_by_id", sa.Integer(), nullable=False), sa.Column("notes", sa.Text(), nullable=True), sa.Column("created_at", sa.DateTime(), nullable=False), sa.CheckConstraint("quantity > 0", name="ck_ticket_spare_parts_quantity_positive"), sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]), sa.ForeignKeyConstraint(["spare_part_id"], ["spare_parts.id"]), sa.ForeignKeyConstraint(["stock_movement_id"], ["stock_movements.id"]), sa.ForeignKeyConstraint(["ticket_id"], ["service_tickets.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("stock_movement_id"))
    op.create_index("ix_ticket_spare_parts_ticket_id", "ticket_spare_parts", ["ticket_id"])
    op.create_index("ix_ticket_spare_parts_spare_part_id", "ticket_spare_parts", ["spare_part_id"])
    op.execute("INSERT INTO permissions (name, description, is_active) VALUES ('consume_ticket_spare', 'Record spare parts consumed on service tickets', true) ON CONFLICT (name) DO NOTHING")


def downgrade() -> None:
    op.execute("DELETE FROM permissions WHERE name = 'consume_ticket_spare'")
    op.drop_index("ix_ticket_spare_parts_spare_part_id", table_name="ticket_spare_parts")
    op.drop_index("ix_ticket_spare_parts_ticket_id", table_name="ticket_spare_parts")
    op.drop_table("ticket_spare_parts")

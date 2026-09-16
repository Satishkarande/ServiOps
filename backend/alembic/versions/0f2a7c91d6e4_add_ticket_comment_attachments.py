"""add ticket comment attachments

Revision ID: 0f2a7c91d6e4
Revises: b8d7f74a5664
Create Date: 2026-09-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0f2a7c91d6e4"
down_revision: Union[str, Sequence[str], None] = "b8d7f74a5664"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ticket_comment_attachments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("comment_id", sa.Integer(), nullable=False),
        sa.Column("uploaded_by_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=255), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["comment_id"], ["ticket_comments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_key"),
    )
    op.create_index("ix_ticket_comment_attachments_comment_id", "ticket_comment_attachments", ["comment_id"])
    op.create_index("ix_ticket_comment_attachments_uploaded_by_id", "ticket_comment_attachments", ["uploaded_by_id"])


def downgrade() -> None:
    op.drop_index("ix_ticket_comment_attachments_uploaded_by_id", table_name="ticket_comment_attachments")
    op.drop_index("ix_ticket_comment_attachments_comment_id", table_name="ticket_comment_attachments")
    op.drop_table("ticket_comment_attachments")

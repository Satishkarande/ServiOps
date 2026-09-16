import os
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.models.base import Base
from app.models.department import Department
from app.models.role import Role
from app.models.permission import Permission 
from app.models.role_permission import RolePermission
from app.models.user import User
from app.models.customer import Customer
from app.models.plant import Plant
from app.models.machine import Machine
from app.models.service_ticket import ServiceTicket
from app.models.notification import Notification
from app.models.ticket_history import TicketHistory
from app.models.spare_part import SparePart
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement
from app.models.ticket_spare_part import TicketSparePart
from app.models.sub_department import SubDepartment
from app.models.ticket_comment import TicketComment
from app.models.ticket_comment_mentions import TicketCommentMention
from app.models.ticket_comment_attachment import TicketCommentAttachment


# Load environment variables
load_dotenv()
# Alembic Config object
config = context.config


# Build database URL from .env
DATABASE_URL = (
    f"postgresql+psycopg2://"
    f"{os.getenv('DATABASE_USER')}:"
    f"{os.getenv('DATABASE_PASSWORD')}@"
    f"{os.getenv('DATABASE_HOST')}:"
    f"{os.getenv('DATABASE_PORT')}/"
    f"{os.getenv('DATABASE_NAME')}"
)


# Give Alembic the database URL
config.set_main_option("sqlalchemy.url", DATABASE_URL)


# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

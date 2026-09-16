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

print(Base.metadata.tables.keys())
from app.database import SessionLocal

from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission


db = SessionLocal()

try:
    user = db.query(User).filter(User.id == 1).first()

    print("User:", user.first_name)
    print("Role:", user.role.name)

    print("Permissions:")

    for permission in user.role.permissions:
        print("-", permission.name)

finally:
    db.close()
"""
Link the seed/demo PostgreSQL users to Amazon Cognito.

This script intentionally does NOT contain a password.
It prompts for the development password at runtime.

Target users:
    EMP001 ... EMP008

For each target user:
    1. Read the email from PostgreSQL.
    2. Find the Cognito user with that email/username.
    3. Create it if it does not exist.
    4. Mark the email as verified.
    5. Set the supplied password as permanent.
    6. Store Cognito's `sub` in users.cognito_user_id.

Run from the backend directory:
    python -m seed.seed_cognito_users

Prerequisites:
    - AWS credentials configured for the CLI/boto3 environment.
    - COGNITO_REGION and COGNITO_USER_POOL_ID in the backend .env.
    - PostgreSQL is running and contains the seeded EMP001..EMP008 users.

Development use only. Do not use one shared password like this in production.
"""

from __future__ import annotations

import getpass
import os

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.database import SessionLocal

# Register every application model before SQLAlchemy configures mappers.
# Several relationships use string class names, so a standalone script must
# import all model modules that the normal FastAPI startup imports.
from app.models.customer import Customer  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.inventory import Inventory  # noqa: F401
from app.models.machine import Machine  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.permission import Permission  # noqa: F401
from app.models.plant import Plant  # noqa: F401
from app.models.role import Role  # noqa: F401
from app.models.role_permission import RolePermission  # noqa: F401
from app.models.service_ticket import ServiceTicket  # noqa: F401
from app.models.spare_part import SparePart  # noqa: F401
from app.models.stock_movement import StockMovement  # noqa: F401
from app.models.sub_department import SubDepartment  # noqa: F401
from app.models.ticket_comment import TicketComment  # noqa: F401
from app.models.ticket_comment_mentions import TicketCommentMention  # noqa: F401
from app.models.ticket_history import TicketHistory  # noqa: F401
from app.models.ticket_spare_part import TicketSparePart  # noqa: F401
from app.models.user import User  # noqa: F401


load_dotenv()

REGION = os.getenv("COGNITO_REGION")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")

TARGET_EMPLOYEE_CODES = [f"EMP{i:03d}" for i in range(1, 9)]


def require_config():
    if not REGION:
        raise RuntimeError("COGNITO_REGION is missing from the backend .env")
    if not USER_POOL_ID:
        raise RuntimeError("COGNITO_USER_POOL_ID is missing from the backend .env")


def find_or_create_cognito_user(cognito, user: User):
    username = user.email

    try:
        response = cognito.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=username,
        )
        return response["Username"], response

    except cognito.exceptions.UserNotFoundException:
        response = cognito.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=username,
            UserAttributes=[
                {"Name": "email", "Value": user.email},
                {"Name": "email_verified", "Value": "true"},
                {
                    "Name": "name",
                    "Value": f"{user.first_name} {user.last_name}",
                },
            ],
            MessageAction="SUPPRESS",
        )
        return response["User"]["Username"], response["User"]


def get_sub(user_response):
    # boto3 uses different attribute keys for these two Cognito APIs:
    # AdminCreateUser -> User["Attributes"]
    # AdminGetUser    -> UserAttributes
    attributes = user_response.get("UserAttributes")
    if attributes is None:
        attributes = user_response.get("Attributes", [])

    for attribute in attributes:
        if attribute.get("Name") == "sub":
            return attribute.get("Value")
    return None


def link_users(password: str):
    require_config()

    cognito = boto3.client("cognito-idp", region_name=REGION)
    db: Session = SessionLocal()

    try:
        users = (
            db.query(User)
            .filter(User.employee_code.in_(TARGET_EMPLOYEE_CODES))
            .order_by(User.employee_code)
            .all()
        )

        found = {user.employee_code: user for user in users}
        missing = [
            code for code in TARGET_EMPLOYEE_CODES if code not in found
        ]

        if missing:
            raise RuntimeError(
                "These seeded PostgreSQL users are missing: "
                + ", ".join(missing)
                + ". Run the database seed first."
            )

        print(f"Using Cognito user pool: {USER_POOL_ID}")
        print(f"Region: {REGION}")
        print()

        for user in users:
            print(
                f"{user.employee_code} | "
                f"{user.first_name} {user.last_name} | "
                f"{user.email}"
            )

            cognito_username, cognito_response = find_or_create_cognito_user(
                cognito, user
            )

            # Ensure the email is treated as verified for this development
            # environment. This avoids verification emails during setup.
            cognito.admin_update_user_attributes(
                UserPoolId=USER_POOL_ID,
                Username=cognito_username,
                UserAttributes=[
                    {"Name": "email", "Value": user.email},
                    {"Name": "email_verified", "Value": "true"},
                    {
                        "Name": "name",
                        "Value": f"{user.first_name} {user.last_name}",
                    },
                ],
            )

            cognito.admin_set_user_password(
                UserPoolId=USER_POOL_ID,
                Username=cognito_username,
                Password=password,
                Permanent=True,
            )

            # Get the latest user representation so the sub is guaranteed to
            # be available even when the user already existed.
            latest = cognito.admin_get_user(
                UserPoolId=USER_POOL_ID,
                Username=cognito_username,
            )
            cognito_sub = get_sub(latest)

            if not cognito_sub:
                raise RuntimeError(
                    f"Could not obtain Cognito sub for {user.email}"
                )

            user.cognito_user_id = cognito_sub
            db.flush()

            print(f"  Linked Cognito sub: {cognito_sub}")

        db.commit()

        print()
        print("Cognito linking completed successfully.")
        print("All EMP001..EMP008 users now have Cognito identities and")
        print("permanent development passwords.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    password = getpass.getpass(
        "Enter the permanent development password for EMP001..EMP008: "
    )

    if not password:
        raise SystemExit("Password cannot be empty.")

    link_users(password)

import os
from functools import lru_cache

import boto3
import requests
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.user import User


load_dotenv()


# ============================================================
# Cognito configuration
# ============================================================

COGNITO_REGION = os.getenv(
    "COGNITO_REGION"
)

COGNITO_USER_POOL_ID = os.getenv(
    "COGNITO_USER_POOL_ID"
)

COGNITO_CLIENT_ID = os.getenv(
    "COGNITO_CLIENT_ID"
)


COGNITO_ISSUER = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
    f"{COGNITO_USER_POOL_ID}"
)


COGNITO_JWKS_URL = (
    f"{COGNITO_ISSUER}/.well-known/jwks.json"
)


# ============================================================
# Cognito Admin Client
# ============================================================

cognito_client = boto3.client(
    "cognito-idp",
    region_name=COGNITO_REGION,
)


# ============================================================
# HTTP Bearer Security
# ============================================================

security = HTTPBearer()


# ============================================================
# Get Cognito Public Keys
# ============================================================

@lru_cache()
def get_cognito_keys():

    response = requests.get(
        COGNITO_JWKS_URL,
        timeout=10
    )

    response.raise_for_status()

    return response.json()["keys"]


# ============================================================
# Verify Cognito JWT
# ============================================================

def verify_token(token: str):

    try:

        keys = get_cognito_keys()


        # ----------------------------------------------------
        # Read token header
        # ----------------------------------------------------

        header = jwt.get_unverified_header(
            token
        )

        kid = header.get("kid")


        if not kid:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Token does not contain "
                    "a key ID"
                )
            )


        # ----------------------------------------------------
        # Find matching Cognito public key
        # ----------------------------------------------------

        key = next(
            (
                key
                for key in keys
                if key["kid"] == kid
            ),
            None
        )


        if key is None:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Invalid token signing key"
                )
            )


        # ----------------------------------------------------
        # Validate and decode JWT
        # ----------------------------------------------------

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=COGNITO_ISSUER,
            options={
                "verify_aud": False
            }
        )


        # ----------------------------------------------------
        # Validate application/client
        # ----------------------------------------------------

        if (
            payload.get("client_id")
            != COGNITO_CLIENT_ID
        ):

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Token was not issued "
                    "for this application"
                )
            )


        # ----------------------------------------------------
        # Get Cognito SUB
        # ----------------------------------------------------

        cognito_user_id = payload.get(
            "sub"
        )


        if not cognito_user_id:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Token does not contain "
                    "user identity"
                )
            )


        return payload


    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Invalid or expired token"
            )
        )


    except requests.RequestException:

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Unable to contact Cognito"
            )
        )


# ============================================================
# Get Current ServiOps User
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
) -> User:

    token = credentials.credentials


    payload = verify_token(
        token
    )


    cognito_user_id = payload["sub"]


    # --------------------------------------------------------
    # Find ServiOps user using Cognito SUB
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.cognito_user_id
            == cognito_user_id
        )
        .first()
    )


    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "User is not registered "
                "in ServiOps"
            )
        )


    # --------------------------------------------------------
    # Check active status
    # --------------------------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "User is inactive"
            )
        )


    return user


# ============================================================
# Permission Helper
# ============================================================

def user_has_permission(
    user: User,
    permission_name: str
) -> bool:

    # --------------------------------------------------------
    # ADMIN HAS FULL ACCESS
    #
    # Admin is treated as the application super-user.
    # This means newly created permissions automatically
    # become available to Admin without requiring a new
    # role_permissions record.
    # --------------------------------------------------------

    if (
        user.role
        and user.role.name.strip().lower()
        == "admin"
    ):

        return True


    # --------------------------------------------------------
    # NORMAL ROLE PERMISSION CHECK
    # --------------------------------------------------------

    if not user.role:

        return False


    return any(

        permission.name
        == permission_name

        and permission.is_active

        for permission
        in user.role.permissions

    )


# ============================================================
# RBAC Dependency
# ============================================================

def require_permission(
    permission_name: str
):

    def permission_checker(
        current_user: User = Depends(
            get_current_user
        )
    ) -> User:

        if not user_has_permission(
            current_user,
            permission_name
        ):

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Permission required: "
                    f"{permission_name}"
                )
            )


        return current_user


    return permission_checker
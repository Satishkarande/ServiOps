from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import (
    COGNITO_USER_POOL_ID,
    cognito_client,
    get_current_user,
    require_permission,
)
from app.dependencies import get_db
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.models.sub_department import SubDepartment
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    UsernameUpdate,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ============================================================
# GET CURRENT LOGGED-IN USER PROFILE
# ============================================================

@router.get(
    "/me"
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):
    """
    Return the currently authenticated ServiOps user,
    organizational hierarchy, direct reports and
    RBAC permissions.
    """

    # --------------------------------------------------------
    # Current user's role
    # --------------------------------------------------------

    role = current_user.role

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User role not found"
        )


    # --------------------------------------------------------
    # Current user's department
    # --------------------------------------------------------

    department = (
        db.query(Department)
        .filter(
            Department.id ==
            current_user.department_id
        )
        .first()
    )


    # --------------------------------------------------------
    # Current user's sub department
    # --------------------------------------------------------

    sub_department = None

    if current_user.sub_department_id:

        sub_department = (
            db.query(SubDepartment)
            .filter(
                SubDepartment.id ==
                current_user.sub_department_id
            )
            .first()
        )


    # --------------------------------------------------------
    # Current user's reporting manager
    # --------------------------------------------------------

    manager = None

    if current_user.manager_id:

        manager_user = (
            db.query(User)
            .filter(
                User.id ==
                current_user.manager_id,
                User.is_active.is_(True)
            )
            .first()
        )

        if manager_user:

            manager_department = (
                db.query(Department)
                .filter(
                    Department.id ==
                    manager_user.department_id
                )
                .first()
            )


            manager_sub_department = None

            if manager_user.sub_department_id:

                manager_sub_department = (
                    db.query(SubDepartment)
                    .filter(
                        SubDepartment.id ==
                        manager_user.sub_department_id
                    )
                    .first()
                )


            manager_role = (
                db.query(Role)
                .filter(
                    Role.id ==
                    manager_user.role_id
                )
                .first()
            )


            manager = {

                "id":
                    manager_user.id,

                "employee_code":
                    manager_user.employee_code,

                "first_name":
                    manager_user.first_name,

                "last_name":
                    manager_user.last_name,

                "email":
                    manager_user.email,

                "department": {

                    "id":
                        manager_department.id
                        if manager_department
                        else None,

                    "name":
                        manager_department.name
                        if manager_department
                        else None,

                }
                if manager_department
                else None,

                "sub_department": {

                    "id":
                        manager_sub_department.id
                        if manager_sub_department
                        else None,

                    "name":
                        manager_sub_department.name
                        if manager_sub_department
                        else None,

                }
                if manager_sub_department
                else None,

                "role": {

                    "id":
                        manager_role.id
                        if manager_role
                        else None,

                    "name":
                        manager_role.name
                        if manager_role
                        else None,

                }
                if manager_role
                else None,

            }


    # --------------------------------------------------------
    # Direct reports / My Team
    # --------------------------------------------------------

    team_users = (
        db.query(User)
        .filter(
            User.manager_id ==
            current_user.id,
            User.is_active.is_(True)
        )
        .order_by(
            User.first_name,
            User.last_name
        )
        .all()
    )


    team = []


    for team_user in team_users:

        team_department = (
            db.query(Department)
            .filter(
                Department.id ==
                team_user.department_id
            )
            .first()
        )


        team_sub_department = None

        if team_user.sub_department_id:

            team_sub_department = (
                db.query(SubDepartment)
                .filter(
                    SubDepartment.id ==
                    team_user.sub_department_id
                )
                .first()
            )


        team_role = (
            db.query(Role)
            .filter(
                Role.id ==
                team_user.role_id
            )
            .first()
        )


        team.append({

            "id":
                team_user.id,

            "employee_code":
                team_user.employee_code,

            "first_name":
                team_user.first_name,

            "last_name":
                team_user.last_name,

            "email":
                team_user.email,

            "department": {

                "id":
                    team_department.id
                    if team_department
                    else None,

                "name":
                    team_department.name
                    if team_department
                    else None,

            }
            if team_department
            else None,

            "sub_department": {

                "id":
                    team_sub_department.id
                    if team_sub_department
                    else None,

                "name":
                    team_sub_department.name
                    if team_sub_department
                    else None,

            }
            if team_sub_department
            else None,

            "role": {

                "id":
                    team_role.id
                    if team_role
                    else None,

                "name":
                    team_role.name
                    if team_role
                    else None,

            }
            if team_role
            else None,

        })


    # --------------------------------------------------------
    # Active RBAC permissions
    # --------------------------------------------------------

    permissions = [

        permission.name

        for permission in role.permissions

        if permission.is_active

    ]


    # --------------------------------------------------------
    # Return complete profile
    # --------------------------------------------------------

    return {

        "id":
            current_user.id,

        "username":
            current_user.username,

        "employee_code":
            current_user.employee_code,

        "username":
            current_user.username,

        "first_name":
            current_user.first_name,

        "last_name":
            current_user.last_name,

        "email":
            current_user.email,

        "department": {

            "id":
                department.id
                if department
                else None,

            "name":
                department.name
                if department
                else None,

        }
        if department
        else None,

        "sub_department": {

            "id":
                sub_department.id
                if sub_department
                else None,

            "name":
                sub_department.name
                if sub_department
                else None,

        }
        if sub_department
        else None,

        "role": {

            "id":
                role.id,

            "name":
                role.name,

        },

        "manager":
            manager,

        "team":
            team,

        "permissions":
            permissions,

    }


# ============================================================
# GET ALL USERS
# ============================================================

@router.get(
    "/",
    response_model=list[UserResponse]
)
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_users")
    )
):
    users = (
        db.query(User)
        .filter(
            User.is_active.is_(True)
        )
        .order_by(User.id)
        .all()
    )

    return users


# ============================================================
# GET USERS AVAILABLE AS REPORTING MANAGERS
# ============================================================

@router.get(
    "/managers",
)
def get_managers(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_users")
    )
):
    users = (
        db.query(User)
        .filter(
            User.is_active.is_(True)
        )
        .order_by(
            User.first_name,
            User.last_name,
        )
        .all()
    )

    return [
        {
            "id":
                user.id,

            "employee_code":
                user.employee_code,

            "first_name":
                user.first_name,

            "last_name":
                user.last_name,

            "department_id":
                user.department_id,

            "sub_department_id":
                user.sub_department_id,

            "role_id":
                user.role_id,
        }
        for user in users
    ]


# ============================================================
# UPDATE CURRENT USERNAME
# ============================================================

@router.patch(
    "/me/username"
)
def update_my_username(
    username_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Allow the authenticated user to change only their own
    ServiOps username. This endpoint intentionally does not
    require manage_users.
    """

    username = str(
        username_data.get("username", "")
    ).strip()

    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required"
        )

    if len(username) < 3 or len(username) > 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 30 characters"
        )

    import re

    if not re.fullmatch(
        r"[A-Za-z0-9._-]+",
        username
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Username can contain only letters, numbers, "
                "dot, underscore, and hyphen"
            )
        )

    existing_user = (
        db.query(User)
        .filter(
            User.username == username,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken"
        )

    current_user.username = username

    try:
        db.commit()
        db.refresh(current_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken"
        )

    return {
        "username": current_user.username
    }


# ============================================================
# GET USERS AVAILABLE FOR @MENTIONS
# ============================================================

@router.get(
    "/mentionable",
)
def get_mentionable_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return active users that can be selected by the
    @mention autocomplete.
    """

    users = (
        db.query(User)
        .filter(
            User.is_active.is_(True)
        )
        .order_by(
            User.first_name,
            User.last_name,
        )
        .all()
    )

    return [
        {
            "id": user.id,
            "employee_code": user.employee_code,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        }
        for user in users
    ]


# ============================================================
# UPDATE CURRENT USERNAME
# ============================================================

@router.patch(
    "/me/username",
)
def update_my_username(
    username_data: UsernameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allow the authenticated user to change only their own
    ServiOps username.

    This endpoint intentionally does not require manage_users.
    """

    username = username_data.username.strip()

    # Pydantic validates the format, but keep the normalized value.
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty",
        )

    existing_user = (
        db.query(User)
        .filter(
            User.username == username,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already in use",
        )

    current_user.username = username

    try:
        db.commit()
        db.refresh(current_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already in use",
        )

    return {
        "message": "Username updated successfully",
        "username": current_user.username,
    }


# ============================================================
# GET SINGLE USER
# ============================================================

@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_users")
    )
):
    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_active.is_(True)
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


# ============================================================
# CREATE USER
# ============================================================

@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_users")
    )
):

    # --------------------------------------------------------
    # Validate Department
    # --------------------------------------------------------

    department = (
        db.query(Department)
        .filter(
            Department.id ==
            user_data.department_id
        )
        .first()
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # --------------------------------------------------------
    # Validate Sub Department
    # --------------------------------------------------------

    if user_data.sub_department_id is not None:

        sub_department = (
            db.query(SubDepartment)
            .filter(
                SubDepartment.id ==
                user_data.sub_department_id,
                SubDepartment.is_active.is_(True),
            )
            .first()
        )

        if sub_department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sub department not found"
            )

        if (
            sub_department.department_id
            != user_data.department_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Sub department does not belong "
                    "to the selected department"
                )
            )

    # --------------------------------------------------------
    # Validate Manager
    # --------------------------------------------------------

    if user_data.manager_id is not None:

        manager = (
            db.query(User)
            .filter(
                User.id ==
                user_data.manager_id,
                User.is_active.is_(True),
            )
            .first()
        )

        if manager is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reporting manager not found"
            )

    # --------------------------------------------------------
    # Validate Role
    # --------------------------------------------------------

    role = (
        db.query(Role)
        .filter(
            Role.id ==
            user_data.role_id
        )
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # --------------------------------------------------------
    # Check Existing ServiOps User
    # --------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            (User.employee_code ==
             user_data.employee_code)
            |
            (User.email ==
             user_data.email)
        )
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Employee code or email "
                "already exists in ServiOps"
            )
        )

    # --------------------------------------------------------
    # Cognito configuration
    # --------------------------------------------------------

    cognito_username = user_data.email
    cognito_user_id = None

    # --------------------------------------------------------
    # Create User in AWS Cognito
    # --------------------------------------------------------

    try:

        cognito_response = (
            cognito_client.admin_create_user(

                UserPoolId=
                    COGNITO_USER_POOL_ID,

                Username=
                    cognito_username,

                UserAttributes=[
                    {
                        "Name": "email",
                        "Value": user_data.email,
                    },
                    {
                        "Name": "email_verified",
                        "Value": "true",
                    },
                    {
                        "Name": "name",
                        "Value": (
                            f"{user_data.first_name} "
                            f"{user_data.last_name}"
                        ),
                    },
                ],

                MessageAction="SUPPRESS",
            )
        )

    except cognito_client.exceptions.UsernameExistsException:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A Cognito user with this "
                "email already exists"
            )
        )

    except cognito_client.exceptions.InvalidParameterException as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cognito rejected the request: {exc}"
            )
        )

    except cognito_client.exceptions.NotAuthorizedException:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Backend is not authorized to "
                "create Cognito users"
            )
        )

    except Exception as exc:

        print(
            "Cognito user creation error:",
            exc
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to create Cognito user"
            )
        )

    # --------------------------------------------------------
    # Get Cognito User
    # --------------------------------------------------------

    cognito_user = cognito_response.get(
        "User"
    )

    if cognito_user is None:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Cognito created the user but "
                "did not return user information"
            )
        )

    # --------------------------------------------------------
    # Extract Cognito SUB
    # --------------------------------------------------------

    for attribute in cognito_user.get(
        "Attributes",
        []
    ):

        if attribute.get("Name") == "sub":

            cognito_user_id = (
                attribute.get("Value")
            )

            break

    # --------------------------------------------------------
    # SUB could not be retrieved
    # --------------------------------------------------------

    if not cognito_user_id:

        try:

            cognito_client.admin_delete_user(
                UserPoolId=
                    COGNITO_USER_POOL_ID,

                Username=
                    cognito_username,
            )

        except Exception as rollback_error:

            print(
                "Cognito rollback failed:",
                rollback_error
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Cognito user was created but "
                "its sub could not be retrieved"
            )
        )

    # --------------------------------------------------------
    # Set Permanent Password
    # --------------------------------------------------------

    try:

        cognito_client.admin_set_user_password(

            UserPoolId=
                COGNITO_USER_POOL_ID,

            Username=
                cognito_username,

            Password=
                user_data.password,

            Permanent=True,
        )

    except cognito_client.exceptions.InvalidPasswordException:

        try:

            cognito_client.admin_delete_user(
                UserPoolId=
                    COGNITO_USER_POOL_ID,

                Username=
                    cognito_username,
            )

        except Exception as rollback_error:

            print(
                "Cognito password rollback failed:",
                rollback_error
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password does not meet the "
                "Cognito password policy"
            )
        )

    except cognito_client.exceptions.NotAuthorizedException:

        try:

            cognito_client.admin_delete_user(
                UserPoolId=
                    COGNITO_USER_POOL_ID,

                Username=
                    cognito_username,
            )

        except Exception as rollback_error:

            print(
                "Cognito password rollback failed:",
                rollback_error
            )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Backend is not authorized to "
                "set the Cognito password"
            )
        )

    except Exception as exc:

        print(
            "Cognito password creation error:",
            exc
        )

        try:

            cognito_client.admin_delete_user(
                UserPoolId=
                    COGNITO_USER_POOL_ID,

                Username=
                    cognito_username,
            )

        except Exception as rollback_error:

            print(
                "Cognito password rollback failed:",
                rollback_error
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to set Cognito user password"
            )
        )

    # --------------------------------------------------------
    # Create User in PostgreSQL
    # --------------------------------------------------------

    new_user = User(
        employee_code=
            user_data.employee_code,

        username=
            user_data.employee_code,

        first_name=
            user_data.first_name,

        last_name=
            user_data.last_name,

        email=
            user_data.email,

        department_id=
            user_data.department_id,

        sub_department_id=
            user_data.sub_department_id,

        manager_id=
            user_data.manager_id,

        role_id=
            user_data.role_id,

        cognito_user_id=
            cognito_user_id,

        is_active=True,
    )

    db.add(new_user)

    # --------------------------------------------------------
    # Commit PostgreSQL User
    # --------------------------------------------------------

    try:

        db.commit()
        db.refresh(new_user)

    except IntegrityError:

        db.rollback()

        try:

            cognito_client.admin_delete_user(
                UserPoolId=
                    COGNITO_USER_POOL_ID,

                Username=
                    cognito_username,
            )

        except Exception as rollback_error:

            print(
                "Cognito rollback failed:",
                rollback_error
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Employee code, email, or "
                "Cognito user ID already exists"
            )
        )

    # --------------------------------------------------------
    # Return Created User
    # --------------------------------------------------------

    return new_user


# ============================================================
# UPDATE USER
# ============================================================

@router.patch(
    "/{user_id}",
    response_model=UserResponse
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_users")
    )
):

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    update_data = user_data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # Validate Department
    # --------------------------------------------------------

    if "department_id" in update_data:

        department = (
            db.query(Department)
            .filter(
                Department.id ==
                update_data["department_id"]
            )
            .first()
        )

        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found"
            )

    # --------------------------------------------------------
    # Validate Sub Department
    # --------------------------------------------------------

    if "sub_department_id" in update_data:

        sub_department_id = (
            update_data["sub_department_id"]
        )

        if sub_department_id is not None:

            sub_department = (
                db.query(SubDepartment)
                .filter(
                    SubDepartment.id ==
                    sub_department_id,
                    SubDepartment.is_active.is_(True),
                )
                .first()
            )

            if sub_department is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Sub department not found"
                )

            department_id = update_data.get(
                "department_id",
                user.department_id,
            )

            if (
                sub_department.department_id
                != department_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Sub department does not belong "
                        "to the selected department"
                    )
                )

    # --------------------------------------------------------
    # Validate Manager
    # --------------------------------------------------------

    if "manager_id" in update_data:

        manager_id = update_data["manager_id"]

        if manager_id is not None:

            if manager_id == user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "A user cannot report "
                        "to themselves"
                    )
                )

            manager = (
                db.query(User)
                .filter(
                    User.id == manager_id,
                    User.is_active.is_(True),
                )
                .first()
            )

            if manager is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Reporting manager not found"
                )

    # --------------------------------------------------------
    # Validate Role
    # --------------------------------------------------------

    if "role_id" in update_data:

        role = (
            db.query(Role)
            .filter(
                Role.id ==
                update_data["role_id"]
            )
            .first()
        )

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

    # --------------------------------------------------------
    # Update User
    # --------------------------------------------------------

    for field, value in update_data.items():

        setattr(
            user,
            field,
            value
        )

    try:

        db.commit()
        db.refresh(user)

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Employee code, email, or "
                "Cognito user ID already exists"
            )
        )

    return user


# ============================================================
# DEACTIVATE USER
# ============================================================

@router.delete(
    "/{user_id}",
    response_model=UserResponse
)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("manage_users")
    )
):

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_active = False

    db.commit()
    db.refresh(user)

    return user
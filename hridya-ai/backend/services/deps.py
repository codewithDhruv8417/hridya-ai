"""FastAPI dependencies for authentication and authorisation.

`Depends(...)` is FastAPI's dependency injection: declare what a route needs in
its signature and FastAPI builds it per request. That is how a router gets a
database session, the current user, or an admin-only guard.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database.session import get_db
from models.enums import AccountStatus, Role
from models.user import User
from services.security import decode_access_token

# auto_error=False lets us decide the error message and support optional auth.
bearer_scheme = HTTPBearer(auto_error=False, description="JWT from /auth/login")

DbSession = Annotated[Session, Depends(get_db)]


def _user_from_credentials(credentials: HTTPAuthorizationCredentials | None, db: Session) -> User | None:
    if credentials is None or not credentials.credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        return None

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        return None

    return db.get(User, user_id)


def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
    db: Session = Depends(get_db),
) -> User | None:
    """Return the signed-in user, or None for guests. Never raises."""
    user = _user_from_credentials(credentials, db)
    if user and user.account_status == AccountStatus.active:
        return user
    return None


def get_current_user(
    user: Annotated[User | None, Depends(get_optional_user)] = None,
) -> User:
    """Require a valid token; 401 otherwise."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


def require_role(*roles: Role):
    """Route guard: `dependencies=[Depends(require_role(Role.admin))]`."""

    def dependency(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {[r.value for r in roles]}",
            )
        return user

    return dependency

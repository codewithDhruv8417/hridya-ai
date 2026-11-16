"""Hashing and JWT helpers.

Two different problems, two different tools:

* **Passwords** must stay secret even if the database leaks, so we store a
  bcrypt hash instead of the password. bcrypt is deliberately slow, which makes
  brute-force guessing expensive. `verify` compares a candidate against a hash
  in constant time.
* **Sessions** need to be stateless: the client sends a signed JWT on every
  request, and we verify the signature instead of looking up a session row.
  The token contains the user id and role, plus an expiry timestamp.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import settings

# bcrypt silently ignores everything after 72 bytes; truncating explicitly keeps
# login working for long passphrases instead of raising.
_BCRYPT_MAX_BYTES = 72

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate(password: str) -> str:
    encoded = password.encode("utf-8")
    if len(encoded) <= _BCRYPT_MAX_BYTES:
        return password
    return encoded[:_BCRYPT_MAX_BYTES].decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    """Turn a plaintext password into a `$2b$12$...` hash for storage."""
    return pwd_context.hash(_truncate(password))


def verify_password(plain_password: str, password_hash: str) -> bool:
    """True when the password matches the stored hash. Never raises on junk."""
    try:
        return pwd_context.verify(_truncate(plain_password), password_hash)
    except Exception:  # noqa: BLE001 - a malformed hash means "not this password"
        return False


def create_access_token(user_id: int, role: str) -> str:
    """Build a signed JWT valid for `access_token_expire_minutes`."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),          # subject = who the token is about
        "role": role,                 # used for cheap role checks
        "iat": int(now.timestamp()),  # issued at
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    """Return the payload, or None when the token is expired/forged/tampered."""
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None

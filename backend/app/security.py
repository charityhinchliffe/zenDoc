import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, JWT_ALGORITHM, JWT_SECRET


def _password_bytes(password: str) -> bytes:
    # bcrypt only uses the first 72 bytes. Hash first so the full password counts.
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")


def hash_secret(secret: str) -> str:
    return bcrypt.hashpw(_password_bytes(secret), bcrypt.gensalt()).decode("utf-8")


def verify_secret(secret: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(secret), stored_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(account_id: int, email: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(account_id), "email": email, "exp": expires_at}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

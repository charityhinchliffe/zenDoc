import base64
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
STORAGE_QUOTA_BYTES = 5 * 1024 * 1024 * 1024

_database_path = os.getenv("DATABASE_PATH", str(BASE_DIR / "zendoc.db"))
DATABASE_PATH = Path(_database_path)
if not DATABASE_PATH.is_absolute():
    DATABASE_PATH = BASE_DIR / DATABASE_PATH

_media_root = os.getenv("MEDIA_ROOT", str(BASE_DIR / "media" / "static"))
MEDIA_ROOT = Path(_media_root)
if not MEDIA_ROOT.is_absolute():
    MEDIA_ROOT = BASE_DIR / MEDIA_ROOT


def _load_file_encryption_key() -> bytes:
    raw = os.getenv("FILE_ENCRYPTION_KEY", "").strip()
    key_file = BASE_DIR / ".encryption_key"
    if not raw and key_file.exists():
        raw = key_file.read_text().strip()
    if not raw:
        raw = base64.urlsafe_b64encode(os.urandom(32)).decode("ascii")
        key_file.write_text(raw + "\n")
    try:
        key = base64.urlsafe_b64decode(raw)
    except Exception as exc:
        raise RuntimeError("FILE_ENCRYPTION_KEY is not valid base64") from exc
    if len(key) != 32:
        raise RuntimeError("FILE_ENCRYPTION_KEY must decode to 32 bytes")
    return key


FILE_ENCRYPTION_KEY = _load_file_encryption_key()

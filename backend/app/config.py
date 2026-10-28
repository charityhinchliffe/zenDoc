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


def _on_vercel() -> bool:
    return os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))


def _can_write(directory: Path) -> bool:
    try:
        directory.mkdir(parents=True, exist_ok=True)
        probe = directory / ".write-probe"
        probe.write_text("ok")
        probe.unlink()
        return True
    except OSError:
        return False


def _writable_path(env_name: str, local_default: Path, temporary_default: Path) -> Path:
    raw = os.getenv(env_name)
    candidate = Path(raw) if raw else local_default
    if not candidate.is_absolute():
        candidate = BASE_DIR / candidate
    if _on_vercel() or not _can_write(candidate.parent):
        temporary_default.parent.mkdir(parents=True, exist_ok=True)
        if temporary_default.suffix:
            temporary_default.touch(exist_ok=True)
        return temporary_default
    return candidate


DATABASE_PATH = _writable_path("DATABASE_PATH", BASE_DIR / "zendoc.db", Path("/tmp/zendoc.db"))
MEDIA_ROOT = _writable_path(
    "MEDIA_ROOT",
    BASE_DIR / "media" / "static",
    Path("/tmp/media/static"),
)


def _load_file_encryption_key() -> bytes:
    raw = os.getenv("FILE_ENCRYPTION_KEY", "").strip()
    key_files = [BASE_DIR / ".encryption_key"]
    if _on_vercel():
        key_files.insert(0, Path("/tmp/zendoc-encryption-key"))
    if not raw:
        for key_file in key_files:
            if key_file.is_file():
                raw = key_file.read_text().strip()
                break
    if not raw:
        raw = base64.urlsafe_b64encode(os.urandom(32)).decode("ascii")
        for key_file in key_files:
            try:
                key_file.write_text(raw + "\n")
                break
            except OSError:
                continue
    try:
        key = base64.urlsafe_b64decode(raw)
    except Exception as exc:
        raise RuntimeError("FILE_ENCRYPTION_KEY is not valid base64") from exc
    if len(key) != 32:
        raise RuntimeError("FILE_ENCRYPTION_KEY must decode to 32 bytes")
    return key


FILE_ENCRYPTION_KEY = _load_file_encryption_key()

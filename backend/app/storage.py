import os
import uuid
from pathlib import Path
from tempfile import SpooledTemporaryFile

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from fastapi import HTTPException, status

from app.config import FILE_ENCRYPTION_KEY, MEDIA_ROOT

_STORED_PREFIX = ("media", "static")
_CHUNK = 1024 * 1024


class StorageQuotaExceeded(Exception):
    pass


def ensure_media_root() -> None:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


def allocate_stored_file(account_id: int) -> tuple:
    ensure_media_root()
    filename = uuid.uuid4().hex + ".bin"
    relative = "/".join(_STORED_PREFIX + (str(account_id), filename))
    destination = absolute_stored_path(relative)
    destination.parent.mkdir(parents=True, exist_ok=True)
    return destination, relative


def absolute_stored_path(stored_path: str) -> Path:
    relative = Path(stored_path)
    if relative.is_absolute() or any(part == ".." for part in relative.parts):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stored path")
    if relative.parts[:2] != _STORED_PREFIX or len(relative.parts) != 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stored path")
    destination = (MEDIA_ROOT / Path(*relative.parts[2:])).resolve()
    root = MEDIA_ROOT.resolve()
    if destination != root and root not in destination.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stored path")
    return destination


def write_encrypted(source, destination: Path, max_bytes: int) -> int:
    nonce = os.urandom(12)
    encryptor = Cipher(algorithms.AES(FILE_ENCRYPTION_KEY), modes.GCM(nonce)).encryptor()
    partial = destination.with_name(destination.name + ".partial")
    total = 0
    try:
        with partial.open("wb") as output:
            output.write(nonce)
            while True:
                chunk = source.read(_CHUNK)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise StorageQuotaExceeded
                output.write(encryptor.update(chunk))
            output.write(encryptor.finalize())
            output.write(encryptor.tag)
        partial.replace(destination)
    except Exception:
        partial.unlink(missing_ok=True)
        destination.unlink(missing_ok=True)
        raise
    return total


def decrypt_stored_file(stored_path: str) -> SpooledTemporaryFile:
    path = absolute_stored_path(stored_path)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file is missing")

    file_size = path.stat().st_size
    if file_size < 28:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Stored file is corrupt")

    spool = SpooledTemporaryFile(max_size=8 * 1024 * 1024)
    try:
        with path.open("rb") as raw:
            nonce = raw.read(12)
            raw.seek(file_size - 16)
            tag = raw.read(16)
            raw.seek(12)
            decryptor = Cipher(algorithms.AES(FILE_ENCRYPTION_KEY), modes.GCM(nonce, tag)).decryptor()
            remaining = file_size - 28
            while remaining:
                chunk = raw.read(min(_CHUNK, remaining))
                if not chunk:
                    break
                remaining -= len(chunk)
                spool.write(decryptor.update(chunk))
            decryptor.finalize()
    except InvalidTag:
        spool.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored file could not be decrypted",
        ) from None
    except Exception:
        spool.close()
        raise
    spool.seek(0)
    return spool


def remove_stored_file(stored_path: str) -> None:
    path = absolute_stored_path(stored_path)
    path.unlink(missing_ok=True)

import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import STORAGE_QUOTA_BYTES
from app.database import get_db
from app.deps import assert_master_password, get_current_account
from app.models import Account, Document, ShareLink
from app.schemas import (
    DocumentListResponse,
    DocumentPublic,
    MasterPasswordRequest,
    ShareLinkResponse,
)
from app.storage import (
    StorageQuotaExceeded,
    allocate_stored_file,
    decrypt_stored_file,
    remove_stored_file,
    write_encrypted,
)

router = APIRouter(tags=["documents"])

_KINDS = {
    ".txt": "Text document",
    ".md": "Text document",
    ".pdf": "PDF document",
    ".doc": "Word document",
    ".docx": "Word document",
    ".csv": "Spreadsheet",
    ".xls": "Spreadsheet",
    ".xlsx": "Spreadsheet",
    ".png": "Image",
    ".jpg": "Image",
    ".jpeg": "Image",
    ".gif": "Image",
    ".webp": "Image",
    ".zip": "Archive",
}


def document_kind(name: str) -> str:
    return _KINDS.get(Path(name).suffix.lower(), "File")


def to_public(document: Document) -> DocumentPublic:
    return DocumentPublic(
        id=document.id,
        name=document.original_name,
        kind=document_kind(document.original_name),
        size_bytes=document.size_bytes,
        content_type=document.content_type,
        created_at=document.created_at,
        updated_at=document.updated_at,
        deleted_at=document.deleted_at,
        encrypted=True,
    )


def _clean_filename(name: Optional[str]) -> str:
    base = Path(name or "upload").name.replace("\x00", "").strip()
    if not base or base in {".", ".."}:
        base = "upload"
    return base[:200]


def _used_bytes(db: Session, account_id: int) -> int:
    used = db.scalar(select(func.coalesce(func.sum(Document.size_bytes), 0)).where(Document.account_id == account_id))
    return int(used or 0)


def _owned_document(db: Session, account: Account, document_id: int, include_deleted: bool = False) -> Document:
    document = db.get(Document, document_id)
    if document is None or document.account_id != account.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if document.deleted_at is not None and not include_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


def _iter_spool(spool) -> Iterator[bytes]:
    try:
        while True:
            chunk = spool.read(1024 * 1024)
            if not chunk:
                break
            yield chunk
    finally:
        spool.close()


def _file_response(document: Document) -> StreamingResponse:
    spool = decrypt_stored_file(document.stored_path)
    filename = quote(document.original_name)
    return StreamingResponse(
        _iter_spool(spool),
        media_type=document.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": "attachment; filename*=UTF-8''%s" % filename,
            "Content-Length": str(document.size_bytes),
        },
    )


@router.get("/documents", response_model=DocumentListResponse)
def list_documents(
    view: str = Query(default="all", pattern="^(all|recent|shared|trash)$"),
    q: Optional[str] = Query(default=None, max_length=200),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> DocumentListResponse:
    statement = select(Document).where(Document.account_id == account.id)
    if view == "trash":
        statement = statement.where(Document.deleted_at.is_not(None))
    else:
        statement = statement.where(Document.deleted_at.is_(None))
    if view == "shared":
        statement = statement.where(
            Document.id.in_(
                select(ShareLink.document_id).where(
                    ShareLink.account_id == account.id,
                    ShareLink.revoked_at.is_(None),
                )
            )
        )
    if q:
        needle = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        statement = statement.where(Document.original_name.ilike("%" + needle + "%", escape="\\"))
    statement = statement.order_by(Document.updated_at.desc(), Document.id.desc())
    documents = db.scalars(statement).all()
    return DocumentListResponse(
        documents=[to_public(document) for document in documents],
        storage_used_bytes=_used_bytes(db, account.id),
        storage_quota_bytes=STORAGE_QUOTA_BYTES,
    )


@router.post("/documents", response_model=DocumentPublic, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> DocumentPublic:
    used = _used_bytes(db, account.id)
    remaining = STORAGE_QUOTA_BYTES - used
    if remaining <= 0:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Storage quota is full")

    destination, stored_path = allocate_stored_file(account.id)
    try:
        size_bytes = write_encrypted(file.file, destination, remaining)
    except StorageQuotaExceeded:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="This file would exceed the 5 GB storage quota",
        ) from None
    finally:
        file.file.close()

    now = datetime.now(timezone.utc)
    document = Document(
        account_id=account.id,
        original_name=_clean_filename(file.filename),
        stored_path=stored_path,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        created_at=now,
        updated_at=now,
    )
    db.add(document)
    try:
        db.commit()
    except Exception:
        db.rollback()
        remove_stored_file(stored_path)
        raise
    db.refresh(document)
    return to_public(document)


@router.post("/documents/{document_id}/download")
def download_document(
    document_id: int,
    body: MasterPasswordRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    assert_master_password(account, body.master_password)
    document = _owned_document(db, account, document_id, include_deleted=True)
    return _file_response(document)


@router.post("/documents/{document_id}/share", response_model=ShareLinkResponse, status_code=status.HTTP_201_CREATED)
def share_document(
    document_id: int,
    body: MasterPasswordRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> ShareLinkResponse:
    assert_master_password(account, body.master_password)
    document = _owned_document(db, account, document_id)
    link = ShareLink(
        document_id=document.id,
        account_id=account.id,
        token=secrets.token_urlsafe(32),
        created_at=datetime.now(timezone.utc),
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return ShareLinkResponse(token=link.token, path="/shares/" + link.token, document_id=document.id)


@router.post("/documents/{document_id}/delete", response_model=DocumentPublic)
def delete_document(
    document_id: int,
    body: MasterPasswordRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> DocumentPublic:
    assert_master_password(account, body.master_password)
    document = _owned_document(db, account, document_id)
    now = datetime.now(timezone.utc)
    document.deleted_at = now
    document.updated_at = now
    links = db.scalars(
        select(ShareLink).where(ShareLink.document_id == document.id, ShareLink.revoked_at.is_(None))
    ).all()
    for link in links:
        link.revoked_at = now
    db.commit()
    db.refresh(document)
    return to_public(document)


@router.get("/shares/{token}")
def download_share(token: str, db: Session = Depends(get_db)) -> StreamingResponse:
    link = db.scalar(select(ShareLink).where(ShareLink.token == token, ShareLink.revoked_at.is_(None)))
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link not found")
    document = db.get(Document, link.document_id)
    if document is None or document.deleted_at is not None or document.account_id != link.account_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link not found")
    return _file_response(document)

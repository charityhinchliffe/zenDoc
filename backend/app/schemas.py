from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    master_password: str = Field(min_length=12, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AccountPublic(BaseModel):
    id: int
    email: str
    full_name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    account: AccountPublic


class MasterPasswordRequest(BaseModel):
    master_password: str = Field(min_length=1, max_length=128)


class DocumentPublic(BaseModel):
    id: int
    name: str
    kind: str
    size_bytes: int
    content_type: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    encrypted: bool = True


class DocumentListResponse(BaseModel):
    documents: List[DocumentPublic]
    storage_used_bytes: int
    storage_quota_bytes: int


class ShareLinkResponse(BaseModel):
    token: str
    path: str
    document_id: int

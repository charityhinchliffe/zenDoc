from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_account
from app.models import Account
from app.schemas import AccountPublic, LoginRequest, SignupRequest, TokenResponse
from app.security import create_access_token, hash_secret, verify_secret

router = APIRouter(prefix="/auth", tags=["auth"])


def _public_account(account: Account) -> AccountPublic:
    return AccountPublic(id=account.id, email=account.email, full_name=account.full_name)


def _token_response(account: Account) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(account.id, account.email),
        account=_public_account(account),
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = body.email.strip().lower()
    full_name = " ".join(body.full_name.split())
    if body.password == body.master_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master password must be different from the account password",
        )
    existing = db.scalar(select(Account).where(Account.email == email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    account = Account(
        email=email,
        password=hash_secret(body.password),
        master_password=hash_secret(body.master_password),
        full_name=full_name,
    )
    db.add(account)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from None
    db.refresh(account)
    return _token_response(account)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = body.email.strip().lower()
    account = db.scalar(select(Account).where(Account.email == email))
    password_ok = account is not None and verify_secret(body.password, account.password)
    if account is None or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return _token_response(account)


@router.get("/me", response_model=AccountPublic)
def me(account: Account = Depends(get_current_account)) -> AccountPublic:
    return _public_account(account)

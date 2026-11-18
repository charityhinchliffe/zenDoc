from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers.auth import router as auth_router
from app.routers.documents import router as documents_router
from app.storage import ensure_media_root


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    ensure_media_root()
    yield


class StripPublicApiPrefix:
    """Vercel routes /api/* to this service with the prefix still on the path."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path") or ""
            if path == "/api" or path.startswith("/api/"):
                stripped = path[len("/api") :] or "/"
                scope = dict(scope)
                scope["path"] = stripped
                if isinstance(scope.get("raw_path"), (bytes, bytearray)):
                    scope["raw_path"] = stripped.encode()
        await self.app(scope, receive, send)


app = FastAPI(title="zenDoc API", lifespan=lifespan)
app.add_middleware(StripPublicApiPrefix)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
app.include_router(auth_router)
app.include_router(documents_router)

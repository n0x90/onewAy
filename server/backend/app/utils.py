import enum
from pathlib import Path
from typing import Literal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Client, User


class Platform(enum.StrEnum):
    """All supported platforms."""

    WINDOWS = "windows"
    MAC = "mac"
    LINUX = "linux"


def resolve_root(path: str) -> str:
    """Resolve a path relative to the project root."""

    root = Path(__file__).resolve().parents[3]
    resolved = path.replace("[ROOT]", str(root))
    return str(Path(resolved))


def get_local_modules_from_dir() -> list[str] | None:
    """Return local module directory names from the configured modules path."""
    from app.logger import get_logger
    from app.settings import settings

    log = get_logger()
    module_dir = Path(settings.paths.modules_path)
    module_names = []

    try:
        for child in module_dir.iterdir():
            if child.is_dir():
                module_names.append(child.parts[-1])

        return module_names if module_names else None
    except OSError:
        log.error("Unable to get module names from modules directory")
        return None


async def user_or_client_uuid(node_uuid: UUID, db: AsyncSession) -> Literal["user", "client"] | None:
    """Return whether the node is a user or a client."""
    result = await db.execute(select(Client).where(Client.uuid == node_uuid))
    client = result.scalars().one_or_none()
    if client:
        return "client"

    result = await db.execute(select(User).where(User.username == node_uuid))
    user = result.scalars().one_or_none()
    if user:
        return "user"

    return None

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocket

from app.logger import get_logger
from app.models import Client
from app.services.websocket_message import (
    Error,
    Ping,
    Pong,
    StartModule,
    Stdout,
    UpdateAliveStatus,
    WebsocketMessage,
)

log = get_logger()


class WebsocketManager:
    """Track active websockets and send payloads by UUID."""

    def __init__(self, label: str):
        self.label = label
        self.connections: dict[UUID, WebSocket] = {}

    async def connect(self, key: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[key] = websocket

    def disconnect(self, key: UUID) -> None:
        self.connections.pop(key, None)

    async def send(
        self, key: UUID, payload: dict[str, object], *, warn_if_missing: bool = True
    ) -> bool:
        ws = self.connections.get(key)
        if ws is None:
            if warn_if_missing:
                log.warning("No %s websocket found for key %s", self.label, key)
            return False

        await ws.send_json(payload)
        return True

    def get_connection(self, key: UUID) -> WebSocket | None:
        return self.connections.get(key)


client_websocket_manager = WebsocketManager("client")
user_websocket_manager = WebsocketManager("user")


async def update_client_presence(
    client_uuid: UUID, alive: bool, db: AsyncSession
) -> Client | None:
    """Persist client presence changes and update last_seen."""
    result = await db.execute(select(Client).where(Client.uuid == client_uuid))
    client = result.scalar_one_or_none()
    if client is None:
        log.warning("Client %s not found", client_uuid)
        return None

    client.alive = alive
    client.last_seen = datetime.now(UTC)

    try:
        await db.commit()
    except SQLAlchemyError:
        await db.rollback()
        raise

    return client


async def broadcast_client_presence(client: Client) -> bool:
    """Broadcast a client presence update to the owning user if connected."""
    payload = UpdateAliveStatus(client_uuid=client.uuid, alive=client.alive).to_json()
    return await user_websocket_manager.send(
        client.owner_uuid,
        payload,
        warn_if_missing=False,
    )


async def set_client_presence(
    client_uuid: UUID, alive: bool, db: AsyncSession
) -> Client | None:
    """Persist client presence and broadcast it to the owning user."""
    client = await update_client_presence(client_uuid, alive, db)
    if client is None:
        return None

    await broadcast_client_presence(client)
    return client


async def handle_message(
    node_uuid: UUID, websocket: WebSocket, msg: WebsocketMessage, db: AsyncSession
) -> None:
    """Handle a parsed websocket message from a client."""
    match msg:
        case Error():
            log.error("Received error message from %s: %s", node_uuid, msg.message)

        case Ping():
            log.info("Received ping from %s, sending pong", node_uuid)
            await websocket.send_json(Pong().to_json())

        case Pong():
            log.debug("Received pong from %s", node_uuid)

        case StartModule():
            pass

        case Stdout():
            pass

        case UpdateAliveStatus():
            await set_client_presence(node_uuid, msg.alive, db)

        case _:
            log.warning("Unknown message type %s", msg)
            await websocket.send_json(
                {"type": "error", "message": "Unknown message type"}
            )

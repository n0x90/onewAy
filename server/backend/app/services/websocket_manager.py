from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocket

from app.logger import get_logger
from app.models import Client, User
from app.services.websocket_message import (
    Error,
    Ping,
    Pong,
    StartModule,
    Stdout,
    WebsocketMessage,
    UpdateAliveStatus,
)

log = get_logger()


class WebsocketManager:
    """Track active client websockets and send payloads by client UUID."""

    def __init__(self):
        self.connections: dict[UUID, WebSocket] = {}

    async def connect(self, key: UUID, websocket: WebSocket):
        await websocket.accept()
        self.connections[key] = websocket

    def disconnect(self, key: UUID):
        self.connections.pop(key)

    async def send(self, key: UUID, payload: dict):
        ws = self.connections.get(key)
        if ws:
            await ws.send_json(payload)
        else:
            log.warning("No websocket found for key %s", key)


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
            result = await db.execute(select(Client).where(Client.uuid == node_uuid))
            client = result.scalars().one_or_none()
            if not client:
                log.warning("Client %s not found", node_uuid)
                return

            result = await db.execute(select(User).where(User.uuid == client.owner_uuid))
            user = result.scalars().one_or_none()
            if not user:
                log.warning("User %s not found", client.owner_uuid)
                return

            await websocket.send_json(msg.to_json())

        case _:
            log.warning("Unknown message type %s", msg)
            await websocket.send_json(
                {"type": "error", "message": "Unknown message type"}
            )


websocket_manager = WebsocketManager()

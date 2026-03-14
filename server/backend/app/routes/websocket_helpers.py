import json
from collections.abc import Awaitable, Callable
from typing import TypeVar
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy import select
from starlette.websockets import WebSocketDisconnect

from app.db.session import AsyncSessionLocal
from app.exceptions import InvalidTokenError, WebsocketMessageInvalidDataType
from app.logger import get_logger
from app.services.auth import extract_ws_token, verify_ws_token
from app.services.websocket_manager import handle_message
from app.services.websocket_message import Error, WebsocketMessage

T = TypeVar("T")
log = get_logger()


async def _close_websocket(
    websocket: WebSocket, code: int, reason: str | None = None
) -> None:
    if reason is None:
        await websocket.close(code=code)
        return

    await websocket.close(code=code, reason=reason)


async def _read_websocket_message(websocket: WebSocket) -> WebsocketMessage | None:
    raw = await websocket.receive_text()

    try:
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise WebsocketMessageInvalidDataType()

        return WebsocketMessage.from_json(data)
    except (
        json.JSONDecodeError,
        ValueError,
        WebsocketMessageInvalidDataType,
    ) as exc:
        match exc:
            case json.JSONDecodeError():
                message = "Invalid JSON"
            case ValueError():
                message = exc.args[0]
            case WebsocketMessageInvalidDataType():
                message = exc.msg

        await websocket.send_json(Error(message).to_json())
        return None


async def handle_authenticated_websocket(
    websocket: WebSocket,
    *,
    model: type[T],
    missing_token_code: int,
    missing_token_reason: str | None,
    invalid_token_code: int,
    invalid_token_log_message: str,
    missing_entity_code: int,
    missing_entity_log_message: Callable[[UUID], str],
    connect: Callable[[UUID, T, WebSocket], Awaitable[None]],
    disconnect: Callable[[UUID], None],
) -> None:
    token = extract_ws_token(websocket)
    if not token:
        await _close_websocket(websocket, missing_token_code, missing_token_reason)
        return

    try:
        node_uuid = verify_ws_token(token)
    except InvalidTokenError:
        await websocket.close(code=invalid_token_code)
        log.warning(invalid_token_log_message)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(model).where(model.uuid == node_uuid))
        entity = result.scalar_one_or_none()
        if entity is None:
            await websocket.close(code=missing_entity_code)
            log.warning(missing_entity_log_message(node_uuid))
            return

        await connect(node_uuid, entity, websocket)
        log.debug("Websocket connected: %s", node_uuid)

        try:
            while True:
                msg = await _read_websocket_message(websocket)
                if msg is None:
                    continue

                await handle_message(node_uuid, websocket, msg, db)
        except WebSocketDisconnect:
            disconnect(node_uuid)

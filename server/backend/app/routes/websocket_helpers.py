import asyncio
import json
from collections.abc import Awaitable, Callable
from time import monotonic
from typing import TypeVar
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketDisconnect

from app.db.session import AsyncSessionLocal
from app.exceptions import InvalidTokenError, WebsocketMessageInvalidDataType
from app.logger import get_logger
from app.services.auth import extract_ws_token, verify_ws_token
from app.services.websocket_manager import handle_message
from app.services.websocket_message import Error, Ping, WebsocketMessage
from app.settings import settings

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


async def _heartbeat_loop(
    websocket: WebSocket,
    node_uuid: UUID,
    label: str,
    get_last_seen: Callable[[], float],
) -> None:
    ping_interval = settings.app.websocket_ping_interval_seconds
    pong_timeout = settings.app.websocket_pong_timeout_seconds

    try:
        while True:
            await asyncio.sleep(ping_interval)

            if monotonic() - get_last_seen() > pong_timeout:
                log.warning("%s websocket %s timed out waiting for pong", label, node_uuid)
                await _close_websocket(websocket, code=1001, reason="Ping timeout")
                return

            await websocket.send_json(Ping().to_json())
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        log.debug("Heartbeat loop ended for %s websocket %s: %s", label, node_uuid, exc)


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
    on_connected: Callable[[UUID, T, AsyncSession], Awaitable[None]] | None = None,
    on_disconnected: Callable[[UUID, T, AsyncSession], Awaitable[None]] | None = None,
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
        if on_connected is not None:
            await on_connected(node_uuid, entity, db)

        last_seen = monotonic()

        def heartbeat_touch() -> None:
            nonlocal last_seen
            last_seen = monotonic()

        heartbeat_task = asyncio.create_task(
            _heartbeat_loop(
                websocket,
                node_uuid,
                getattr(model, "__name__", "node").lower(),
                lambda: last_seen,
            )
        )

        try:
            while True:
                msg = await _read_websocket_message(websocket)
                if msg is None:
                    continue

                heartbeat_touch()

                await handle_message(node_uuid, websocket, msg, db)
        except WebSocketDisconnect:
            if on_disconnected is not None:
                await on_disconnected(node_uuid, entity, db)
        finally:
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass
            disconnect(node_uuid)

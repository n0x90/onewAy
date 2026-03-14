from fastapi import APIRouter, WebSocket

from app.models.client import Client
from app.routes.websocket_helpers import handle_authenticated_websocket
from app.services.websocket_manager import WebsocketManager

router = APIRouter(prefix="/client", tags=["client"])
ws_manager = WebsocketManager()


@router.websocket("/ws")
async def client_ws(websocket: WebSocket):
    """Handle authenticated client websocket connections and messages."""
    await handle_authenticated_websocket(
        websocket,
        model=Client,
        missing_token_code=1008,
        missing_token_reason=None,
        invalid_token_code=1008,
        invalid_token_log_message="Failed to verify websocket token",
        missing_entity_code=1008,
        missing_entity_log_message=(
            lambda client_uuid: (
                f"Websocket auth failed: client with uuid {client_uuid} not found"
            )
        ),
        connect=lambda client_uuid, _client, active_websocket: ws_manager.connect(
            client_uuid, active_websocket
        ),
        disconnect=ws_manager.disconnect,
    )


# - [ ] /client/update-info
# - [ ] /client/sync-modules

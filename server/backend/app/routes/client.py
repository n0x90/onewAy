from fastapi import APIRouter, WebSocket

from app.models.client import Client
from app.routes.websocket_helpers import handle_authenticated_websocket
from app.services.websocket_manager import client_websocket_manager, set_client_presence

router = APIRouter(prefix="/client", tags=["client"])


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
        connect=lambda client_uuid, _client, active_websocket: client_websocket_manager.connect(
            client_uuid, active_websocket
        ),
        disconnect=client_websocket_manager.disconnect,
        on_connected=lambda client_uuid, _client, db: set_client_presence(
            client_uuid, True, db
        ),
        on_disconnected=lambda client_uuid, _client, db: set_client_presence(
            client_uuid, False, db
        ),
    )


# - [ ] /client/update-info
# - [ ] /client/sync-modules

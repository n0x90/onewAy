use std::sync::Arc;
use std::time::Duration;

use crate::api_client::ApiClient;
use crate::config::{API_URL, PASSWORD, USERNAME};
use crate::schemas::auth::{
    ClientAuthLoginRequest,
    ClientAuthLoginResponse,
    ClientAuthWsTokenResponse,
};
use crate::websocket_client::WebsocketClient;
use tokio::time::sleep;

mod api_client;
mod logger;
mod schemas;
mod websocket_client;
mod module_manager;
mod websocket_message;
mod config;

#[tokio::main]
async fn main() {
    debug!("Starting onewAy client");
    let mut mod_manager = module_manager::ModuleManager::new();
    if let Err(err) = mod_manager.init("modules/".as_ref()) {
        error!("Failed to start module manager: {}", err);
        return;
    }

    let mut client = match ApiClient::new(API_URL) {
        Ok(client) => client,
        Err(err) => {
            error!("Failed to create API client: {}", err.detail);
            return;
        }
    };

    let login_data: ClientAuthLoginRequest = ClientAuthLoginRequest {
        username: USERNAME.to_string(),
        password: PASSWORD.to_string(),
    };
    let response = client
        .post::<ClientAuthLoginRequest, ClientAuthLoginResponse>("/client/auth/login", &login_data)
        .await;
    let response = match response {
        Ok(response) => response,
        Err(err) => {
            error!("Failed to login: {}", err.detail);
            return;
        }
    };

    client.set_access_token(response.access_token);
    let ws_url = format!(
        "{}/client/ws",
        API_URL
            .replace("https://", "wss://")
            .replace("http://", "ws://")
    );

    loop {
        let ws_token = client
            .get::<ClientAuthWsTokenResponse>("/client/auth/ws-token")
            .await;
        let ws_token = match ws_token {
            Ok(token) => token,
            Err(err) => {
                error!("Failed to get websocket token: {}", err.detail);
                if err.status_code == 401 || err.status_code == 403 {
                    return;
                }

                warn!("Retrying websocket setup in 3 seconds");
                sleep(Duration::from_secs(3)).await;
                continue;
            }
        };

        let ws_client = Arc::new(WebsocketClient::new(ws_url.clone(), ws_token.token));
        mod_manager.set_websocket_client(ws_client.clone());

        let handle = match ws_client.run().await {
            Ok(handle) => handle,
            Err(err) => {
                error!("Failed to run websocket client: {}", err);
                warn!("Retrying websocket setup in 3 seconds");
                sleep(Duration::from_secs(3)).await;
                continue;
            }
        };

        if let Err(err) = handle.await {
            error!("Websocket task failed: {}", err);
        } else {
            warn!("Websocket connection closed");
        }

        sleep(Duration::from_secs(3)).await;
    }
}

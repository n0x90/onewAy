use crate::api_client::ApiClient;
use crate::config::{API_URL, PASSWORD, USERNAME};
use crate::schemas::auth::{
    ClientAuthLoginRequest,
    ClientAuthLoginResponse,
    ClientAuthWsTokenResponse,
};
use crate::websocket_client::WebsocketClient;

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
    mod_manager.init("modules/".as_ref()).expect("Failed to start module manager");

    let mut client = ApiClient::new(API_URL).expect("Failed to create api client");

    let login_data: ClientAuthLoginRequest = ClientAuthLoginRequest {
        username: USERNAME.to_string(),
        password: PASSWORD.to_string(),
    };
    let response = client
        .post::<ClientAuthLoginRequest, ClientAuthLoginResponse>("/client/auth/login", &login_data)
        .await
        .expect("Failed to login");

    client.set_access_token(response.access_token);

    let ws_token = client
        .get::<ClientAuthWsTokenResponse>("/client/auth/ws-token")
        .await
        .expect("Failed to get websocket token");

    let ws_url = format!("{}/client/ws", API_URL.replace("https://", "wss://"));
    let ws_client = WebsocketClient::new(ws_url, ws_token.token);
    ws_client.run().await.expect("Failed to run websocket client");
}

use crate::api_client::ApiClient;
use crate::schemas::auth::{
    ClientAuthLoginRequest,
    ClientAuthLoginResponse,
    ClientAuthWsTokenResponse,
};
use crate::websocket_client::WebsocketClient;

mod api_client;
mod config;
mod logger;
mod schemas;
mod websocket_client;
mod module_manager;
mod websocket_message;

#[tokio::main]
async fn main() {
    debug!("Starting onewAy client");
    let api_base_url = "https://localhost:8000";
    let mut client = ApiClient::new(api_base_url).expect("Failed to create api client");

    let login_data: ClientAuthLoginRequest = ClientAuthLoginRequest {
        username: String::from("client_0"),
        password: String::from("pass"),
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

    let ws_url = format!("{}/client/ws", api_base_url.replace("https://", "wss://"));
    let ws_client = WebsocketClient::new(ws_url, ws_token.token);
    ws_client.run().await.expect("Failed to run websocket client");
}

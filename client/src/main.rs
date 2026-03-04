use crate::api_client::ApiClient;
use crate::schemas::auth::{ClientAuthLoginRequest, ClientAuthLoginResponse};

mod api_client;
mod config;
mod logger;
mod schemas;
mod websocket_client;
mod module_manager;

#[tokio::main]
async fn main() {
    debug!("Starting onewAy client");
    let mut client = ApiClient::new("https://localhost:8000").expect("Failed to create api client");

    let login_data: ClientAuthLoginRequest = ClientAuthLoginRequest {
        username: String::from("client_0"),
        password: String::from("pass"),
    };
    let response = client
        .post::<ClientAuthLoginRequest, ClientAuthLoginResponse>("/client/auth/login", &login_data)
        .await
        .expect("Failed to login");

    client.set_access_token(response.access_token);
}

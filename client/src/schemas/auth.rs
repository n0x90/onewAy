use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ClientAuthLoginRequest {
    pub(crate) username: String,
    pub(crate) password: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ClientAuthLoginResponse {
    pub(crate) access_token: String,
}

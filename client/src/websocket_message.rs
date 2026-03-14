use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WebsocketMessage {
    #[serde(rename = "error")]
    Error { message: String },

    #[serde(rename = "ping")]
    Ping,

    #[serde(rename = "pong")]
    Pong,

    #[serde(rename = "start_module")]
    Start { module_name: String },

    #[serde(rename = "stop_job")]
    Stop { job_id: String },

    #[serde(rename = "stdout")]
    Stdout { job_id: String, data: String },

    #[serde(rename = "stdin")]
    Stdin { job_id: String, data: String },

    #[serde(rename = "stderr")]
    Stderr { job_id: String, data: String },

    #[serde(rename = "update_alive_status")]
    UpdateAliveStatus { client_uuid: String, alive: bool },
}

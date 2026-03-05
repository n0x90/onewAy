use std::sync::Arc;

use futures::stream::{SplitSink, SplitStream};
use futures::{SinkExt, StreamExt};
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::http::header::{AUTHORIZATION, HeaderValue};
use tokio_tungstenite::tungstenite::{Error, Message};
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

use crate::websocket_message::WebsocketMessage;
use crate::{debug, error};

pub struct WebsocketClient {
    ws_url: String,
    ws_token: String,
    write: Arc<Mutex<Option<SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>>>>,
}

impl WebsocketClient {
    pub fn new(ws_url: impl Into<String>, ws_token: impl Into<String>) -> Self {
        Self {
            ws_url: ws_url.into(),
            ws_token: ws_token.into(),
            write: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn run(&self) -> Result<(), Error> {
        let mut request = self.ws_url.clone().into_client_request()?;
        let auth_header = HeaderValue::from_str(&format!("Bearer {}", self.ws_token))
            .expect("failed to build websocket authorization header");
        request.headers_mut().insert(AUTHORIZATION, auth_header);

        let (ws_stream, _) = connect_async(request).await?;
        debug!("Websocket connected to {}", self.ws_url);
        let (write, read) = ws_stream.split();
        {
            let mut write_guard = self.write.lock().await;
            *write_guard = Some(write);
        }

        Self::async_recv(self.write.clone(), read).await;

        let mut write_guard = self.write.lock().await;
        *write_guard = None;
        Ok(())
    }

    async fn async_recv(
        write: Arc<Mutex<Option<SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>>>>,
        mut read: SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>,
    ) {
        while let Some(message) = read.next().await {
            match message {
                Ok(Message::Text(text)) => match serde_json::from_str::<WebsocketMessage>(&text) {
                    Ok(ws_message) => match ws_message {
                        WebsocketMessage::Error { message } => error!("{message}"),
                        WebsocketMessage::Ping => {
                            debug!("Received ping");
                            match serde_json::to_string(&WebsocketMessage::Pong) {
                                Ok(payload) => {
                                    let mut write_guard = write.lock().await;
                                    if let Some(ws_write) = write_guard.as_mut() {
                                        if let Err(err) =
                                            ws_write.send(Message::Text(payload.into())).await
                                        {
                                            error!("Failed to send pong: {}", err);
                                        }
                                    } else {
                                        error!(
                                            "Failed to send pong: websocket writer is not available"
                                        );
                                    }
                                }
                                Err(err) => error!("Failed to serialize pong message: {}", err),
                            }
                        }
                        WebsocketMessage::Pong => debug!("Received pong"),
                        WebsocketMessage::Start { module_name } => {
                            debug!("Received start_module for module: {}", module_name)
                        }
                        WebsocketMessage::Stop { job_id } => {
                            debug!("Received stop_job for job: {}", job_id)
                        }
                        WebsocketMessage::Stdout { job_id, data } => {
                            debug!("Received stdout for job {}: {}", job_id, data)
                        }
                        WebsocketMessage::Stdin { job_id, data } => {
                            debug!("Received stdin for job {}: {}", job_id, data)
                        }
                        WebsocketMessage::Stderr { job_id, data } => {
                            debug!("Received stderr for job {}: {}", job_id, data)
                        }
                    },
                    Err(err) => error!("Invalid websocket message received: {}", err),
                },
                Ok(_) => error!("Invalid websocket message received"),
                Err(err) => {
                    error!("Websocket receive error: {}", err);
                    break;
                }
            }
        }
    }
}

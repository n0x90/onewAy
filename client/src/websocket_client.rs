use futures::stream::SplitStream;
use futures::StreamExt;
use tokio_tungstenite::{connect_async, WebSocketStream};
use tokio_tungstenite::tungstenite::Error;
use crate::debug;

pub struct WebsocketClient {
    base_url: String,
}

impl WebsocketClient {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into(),
        }
    }

    pub async fn run(&self) -> Result<(), Error> {
        let (ws_stream, _) = connect_async(&self.base_url).await?;
        debug!("Websocket connected to {}", self.base_url);
        let (mut write, mut read) = ws_stream.split();
        tokio::spawn(Self::async_recv(read));

        Ok(())
    }

    async fn async_recv<T>(mut read: SplitStream<WebSocketStream<T>>)
    where
        T: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
    {
        while let Some(message) = read.next().await {
            debug!("Message: {:?}", message);
        }
    }
}
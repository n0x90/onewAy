use reqwest::Client;
use serde::{Serialize, de::DeserializeOwned};

#[derive(Debug, Clone)]
pub struct ApiError {
    pub status_code: i32,
    pub detail: String,
}

#[derive(serde::Deserialize)]
pub struct ApiErrorJson {
    pub detail: String,
}

pub struct ApiClient {
    base_url: String,
    client: Client,
}

impl ApiClient {
    pub fn new(base_url: impl Into<String>) -> Result<Self, ApiError> {
        let client = Client::builder()
            .cookie_store(true)
            .build()
            .map_err(|e| ApiError {
                status_code: -1,
                detail: format!("Failed to build reqwest client: {}", e),
            })?;

        Ok(Self {
            base_url: base_url.into(),
            client,
        })
    }

    pub async fn get<T: DeserializeOwned>(
        &self,
        endpoint: impl Into<String>,
    ) -> Result<T, ApiError> {
        let request = self
            .client
            .get(format!("{}{}", self.base_url, endpoint.into()));
        self.handle_request(request).await
    }

    pub async fn post<Req, Resp>(
        &self,
        endpoint: impl Into<String>,
        body: &Req,
    ) -> Result<Resp, ApiError>
    where
        Req: Serialize,
        Resp: DeserializeOwned,
    {
        let request = self
            .client
            .post(format!("{}{}", self.base_url, endpoint.into()))
            .json(body);
        self.handle_request(request).await
    }

    async fn handle_request<T: DeserializeOwned>(
        &self,
        request: reqwest::RequestBuilder,
    ) -> Result<T, ApiError> {
        let response = request.send().await.map_err(|e| ApiError {
            status_code: -1,
            detail: format!("Transport error: {}", e),
        })?;

        let status = response.status();
        if status.is_success() {
            return response.json::<T>().await.map_err(|e| ApiError {
                status_code: -1,
                detail: format!("Failed to parse success response: {}", e),
            });
        }

        let backend_error = response
            .json::<ApiErrorJson>()
            .await
            .map_err(|_| ApiError {
                status_code: status.as_u16() as i32,
                detail: "Failed to parse error response body".into(),
            })?;

        Err(ApiError {
            status_code: status.as_u16() as i32,
            detail: backend_error.detail,
        })
    }
}

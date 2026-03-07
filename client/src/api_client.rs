use reqwest::Client;
use serde::{Serialize, de::DeserializeOwned};
use std::error::Error as StdError;
use std::fs;

use crate::config::{backend_cert_path, insecure_tls_enabled};
use crate::warn;

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
    access_token: Option<String>,
}

impl ApiClient {
    pub fn new(base_url: impl Into<String>) -> Result<Self, ApiError> {
        let base_url = base_url.into();
        let allow_insecure_tls = insecure_tls_enabled();

        let mut builder = Client::builder().cookie_store(true);
        if base_url.starts_with("https://") {
            if allow_insecure_tls {
                warn!("ONEWAY_INSECURE_TLS enabled: TLS certificate and hostname verification disabled");
                builder = builder
                    .danger_accept_invalid_certs(true)
                    .danger_accept_invalid_hostnames(true);
            } else {
                let cert_path = backend_cert_path();
                let cert_pem = fs::read(&cert_path).map_err(|e| ApiError {
                    status_code: -1,
                    detail: format!(
                        "Failed to read TLS certificate at {}: {}",
                        cert_path.display(),
                        e
                    ),
                })?;

                let cert = reqwest::Certificate::from_pem(&cert_pem).map_err(|e| ApiError {
                    status_code: -1,
                    detail: format!(
                        "Failed to parse TLS certificate PEM at {}: {}",
                        cert_path.display(),
                        e
                    ),
                })?;

                builder = builder.add_root_certificate(cert);
            }
        }

        let client = builder.build().map_err(|e| ApiError {
            status_code: -1,
            detail: format!("Failed to build reqwest client: {}", e),
        })?;

        Ok(Self {
            base_url,
            client,
            access_token: None,
        })
    }

    pub async fn get<T: DeserializeOwned>(
        &self,
        endpoint: impl Into<String>,
    ) -> Result<T, ApiError> {
        let endpoint = endpoint.into();
        let url = format!("{}{}", self.base_url, endpoint);
        let request = self
            .client
            .get(url.clone());
        self.handle_request(request, &url).await
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
        let endpoint = endpoint.into();
        let url = format!("{}{}", self.base_url, endpoint);
        let request = self
            .client
            .post(url.clone())
            .json(body);
        self.handle_request(request, &url).await
    }

    async fn handle_request<T: DeserializeOwned>(
        &self,
        request: reqwest::RequestBuilder,
        url: &str,
    ) -> Result<T, ApiError> {
        let request = if let Some(access_token) = &self.access_token {
            request.bearer_auth(access_token)
        } else {
            request
        };

        let response = request.send().await.map_err(|e| {
            let mut detail = format!("Transport error for {}: {}", url, e);
            let mut source = e.source();
            while let Some(cause) = source {
                detail.push_str(&format!("; caused by: {}", cause));
                source = cause.source();
            }

            ApiError {
            status_code: -1,
            detail,
        }
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
    
    pub fn set_access_token(&mut self, access_token: impl Into<String>) {
        self.access_token = Some(access_token.into());
    }
}

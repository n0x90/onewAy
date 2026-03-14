from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.utils import Platform


class UserMeResponse(BaseModel):
    username: str


class UserAllClientsResponse(BaseModel):
    all_clients: list[str]


class UserQueryClientBasicInfoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uuid: UUID
    username: str
    ip_address: str | None
    hostname: str | None
    platform: Platform
    alive: bool


class UserRegisterClientRequest(BaseModel):
    username: str
    password: str
    platform: Platform


class RefreshTokenBasicInfo(BaseModel):
    uuid: UUID
    expires_at: datetime
    created_at: datetime
    revoked: bool


class UserQueryClientAllInfoResponse(UserQueryClientBasicInfoResponse):
    uuid: UUID
    blocked: bool
    version: str
    last_seen: datetime | None
    owner_uuid: UUID
    installed_modules: list[str]
    refresh_tokens: list[RefreshTokenBasicInfo]


class UserQueryClientInstalledModulesResponse(BaseModel):
    installed_modules: list[str]


class UserClientJobInfo(BaseModel):
    job_uuid: UUID
    module_name: str


class UserQueryClientJobsResponse(BaseModel):
    jobs: list[UserClientJobInfo]


class UserModuleCatalogItemResponse(BaseModel):
    name: str
    description: str | None
    version: str | None
    local_version: str | None
    in_database: bool
    has_local_directory: bool
    installed_client_count: int
    supports_windows: bool
    supports_mac: bool
    supports_linux: bool


class UserModuleCatalogResponse(BaseModel):
    modules: list[UserModuleCatalogItemResponse]


class UserModifyClientInstallModuleRequest(BaseModel):
    module_name: str


class UserRunModuleRequest(BaseModel):
    client_username: str


class UserMetasploitOptionsModResponse(BaseModel):
    data: dict[str, dict[str, Any]]


class UserMetasploitModulesResponse(BaseModel):
    modules: list[str]


class UserMetasploitJobInfo(BaseModel):
    job_id: str
    description: str


class UserMetasploitJobsResponse(BaseModel):
    jobs: list[UserMetasploitJobInfo]


class UserMetasploitAdvancedOptionsModResponse(BaseModel):
    data: dict[str, dict[str, Any]]


class UserMetasploitRunModRequest(BaseModel):
    opts: dict[str, Any]


class UserMetasploitRunModResponse(BaseModel):
    result: dict[str, Any]


class UserBuildClientRequest(BaseModel):
    username: str
    password: str
    platform: Platform
    api_url: str
    log: bool = False
    debug: bool = False
    static: bool = True

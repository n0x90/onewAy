export type Platform = 'windows' | 'mac' | 'linux';

export interface UserAllClientsResponse {
  allClients: string[];
}

export interface UserQueryClientBasicInfoResponse {
  uuid: string;
  username: string;
  ipAddress: string | null;
  hostname: string | null;
  platform: Platform;
  alive: boolean;
}

export interface RefreshTokenBasicInfo {
  uuid: string;
  expiresAt: string;
  createdAt: string;
  revoked: boolean;
}

export interface UserQueryClientAllInfoResponse extends UserQueryClientBasicInfoResponse {
  blocked: boolean;
  version: string;
  lastSeen: string | null;
  ownerUuid: string;
  installedModules: string[];
  refreshTokens: RefreshTokenBasicInfo[];
}

export interface UserQueryClientInstalledModulesResponse {
  installedModules: string[];
}

export interface UserClientJobInfo {
  jobUuid: string;
  moduleName: string;
}

export interface UserQueryClientJobsResponse {
  jobs: UserClientJobInfo[];
}

export interface UserRegisterClientRequest {
  username: string;
  password: string;
  platform: Platform;
}

export interface UserModifyClientInstallModuleRequest {
  moduleName: string;
}

export interface UserRunModuleRequest {
  clientUsername: string;
}

export interface UserModuleCatalogItemResponse {
  name: string;
  description: string | null;
  version: string | null;
  localVersion: string | null;
  inDatabase: boolean;
  hasLocalDirectory: boolean;
  installedClientCount: number;
  supportsWindows: boolean;
  supportsMac: boolean;
  supportsLinux: boolean;
}

export interface UserModuleCatalogResponse {
  modules: UserModuleCatalogItemResponse[];
}

export interface UserMetasploitModulesResponse {
  modules: string[];
}

export interface UserMetasploitJobsResponse {
  jobs: {
    jobId: string;
    description: string;
  }[];
}

export interface UserMetasploitOptionsModResponse {
  data: Record<string, Record<string, string>>;
}

export interface UserMetasploitAdvancedOptionsModResponse {
  data: Record<string, Record<string, string>>;
}

export interface UserMetasploitRunModRequest {
  opts: Record<string, string>;
}

export interface UserMetasploitRunModResponse {
  result: Record<string, unknown>;
}

export interface UserBuildClientRequest {
  username: string;
  password: string;
  platform: Platform;
  apiUrl: string;
  log: boolean;
  debug: boolean;
  static: boolean;
}

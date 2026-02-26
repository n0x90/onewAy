export type Platform = 'windows' | 'mac' | 'linux';

export interface UserAllClientsResponse {
  allClients: string[];
}

export interface UserQueryClientBasicInfoResponse {
  username: string;
  ipAddress: string | null;
  hostname: string | null;
  platform: Platform;
  alive: boolean;
}

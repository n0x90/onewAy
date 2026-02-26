export interface UserAuthLoginRequest {
  username: string,
  password: string,
}

export interface UserAuthLoginResponse {
  accessToken: string,
}

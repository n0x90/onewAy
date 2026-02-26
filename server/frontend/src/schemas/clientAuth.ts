export interface UserAuthLoginRequest {
  username: string,
  password: string,
}

export interface UserAuthLoginResponse {
  access_token: string,
}

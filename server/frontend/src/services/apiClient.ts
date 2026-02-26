import {
  convertObjectKeysToCamelCase,
  convertObjectKeysToSnakeCase,
} from '../utils';

export interface ApiError {
  statusCode: number;
  detail: string;
}

interface ErrorResponseBody {
  detail?: string;
}

interface RootResponseBody {
  message?: string;
}

export interface UserSessionStatus {
  authenticated: boolean;
}

const AUTH_STORAGE_KEY = 'userAuthenticated';

export function isApiError(resp: unknown): resp is ApiError {
  return (
    typeof resp === 'object' &&
    resp !== null &&
    'statusCode' in resp &&
    typeof (resp as { statusCode: unknown }).statusCode === 'number' &&
    'detail' in resp &&
    typeof (resp as { detail: unknown }).detail === 'string'
  );
}

export class ApiClient {
  private apiUrl: string | undefined = undefined;

  async init(): Promise<void> {
    const apiUrl = localStorage.getItem('apiUrl');
    if (apiUrl !== null && apiUrl.length > 0) {
      const validated = await this.validateUrl(apiUrl);
      if (validated) {
        this.setApiUrl(apiUrl);
      }
    }
  }

  private async request<TResponse>(
    endpoint: string,
    init: RequestInit = {},
  ): Promise<TResponse | ApiError> {
    if (!this.apiUrl) return { statusCode: -1, detail: 'Api url not set' };

    let response: Response;
    const requestInit: RequestInit = {
      credentials: 'include',
      ...init,
    };

    if (typeof requestInit.body === 'string') {
      try {
        const parsedBody = JSON.parse(requestInit.body) as unknown;
        requestInit.body = JSON.stringify(convertObjectKeysToSnakeCase(parsedBody));
      } catch {
        // Leave body unchanged if it is not JSON.
      }
    }

    try {
      response = await fetch(this.apiUrl + endpoint, requestInit);
    } catch (err) {
      return {
        statusCode: -1,
        detail: `Failed to send request: ${err instanceof Error ? err.message : 'Unknown Error'}`,
      };
    }

    if (!response.ok) {
      let detail: string;
      try {
        const body = (await response.json()) as ErrorResponseBody;
        detail = body.detail ?? 'Unknown error';
      } catch {
        return {
          statusCode: response.status,
          detail: 'Server sent unkown error',
        };
      }

      return {
        statusCode: response.status,
        detail,
      };
    }

    if (response.status === 204) {
      return {} as TResponse;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return {
        statusCode: response.status,
        detail: 'Response was not valid JSON',
      };
    }

    return convertObjectKeysToCamelCase(data as TResponse);
  }

  async get<TResponse>(endpoint: string): Promise<TResponse | ApiError> {
    return this.request<TResponse>(endpoint, { method: 'GET' });
  }

  async post<TResponse, TBody>(
    endpoint: string,
    body: TBody,
  ): Promise<TResponse | ApiError> {
    return this.request<TResponse>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async put<TResponse, TBody>(
    endpoint: string,
    body: TBody,
  ): Promise<TResponse | ApiError> {
    return this.request<TResponse>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async patch<TResponse, TBody>(
    endpoint: string,
    body: TBody,
  ): Promise<TResponse | ApiError> {
    return this.request<TResponse>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async delete<TResponse>(endpoint: string): Promise<TResponse | ApiError> {
    return this.request<TResponse>(endpoint, { method: 'DELETE' });
  }

  async validateUrl(url: string): Promise<boolean> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      return false;
    }

    if (!response.ok) {
      return false;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return false;
    }

    const normalized = convertObjectKeysToCamelCase(data as RootResponseBody);
    if (
      typeof normalized === 'object' &&
      normalized !== null &&
      'message' in normalized &&
      typeof normalized.message === 'string' &&
      normalized.message === 'onewAy'
    ) {
      return true;
    }

    return false;
  }

  async checkUserSession(): Promise<UserSessionStatus> {
    const result = await this.get('/user/me');
    if (isApiError(result)) {
      return { authenticated: false };
    }

    return { authenticated: true };
  }

  setApiUrl(url: string): void {
    if (url.endsWith('/')) url = url.slice(0, -1);
    this.apiUrl = url;
    localStorage.setItem('apiUrl', url);
  }

  getApiUrl(): string | undefined {
    return this.apiUrl;
  }

  isAuthenticated(): boolean {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  }

  setAuthenticated(authenticated: boolean): void {
    if (authenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  clearAuth(): void {
    this.setAuthenticated(false);
  }
}

export const apiClient = new ApiClient();
await apiClient.init();

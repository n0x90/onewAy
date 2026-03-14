import { convertObjectKeysToCamelCase, convertObjectKeysToSnakeCase } from '../utils';
import type { ApiError } from '../services/apiClient';
import { apiClient, isApiError } from '../services/apiClient';
import { Severity, useErrorStore } from '../services/errorStore';
import { useLiveClientStore } from '../services/liveClientStore';

export interface UserAuthWsTokenResponse {
  token: string;
}

export interface WebsocketMessage {
  type: string;
}

export interface WebsocketErrorMessage extends WebsocketMessage {
  type: 'error';
  message: string;
}

export interface PingMessage extends WebsocketMessage {
  type: 'ping';
}

export interface PongMessage extends WebsocketMessage {
  type: 'pong';
}

export interface UpdateAliveStatusMessage extends WebsocketMessage {
  type: 'update_alive_status';
  clientUuid: string;
  alive: boolean;
}

export type WsConnectionState = 'idle' | 'connecting' | 'open';
export type WsMessageHandler = (message: WebsocketMessage) => void;

function isWebsocketMessage(value: unknown): value is WebsocketMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as { type: unknown }).type === 'string'
  );
}

function getErrorMessage(error: ApiError): string {
  if (error.statusCode === 401 || error.statusCode === 403) {
    return 'WebSocket authentication failed.';
  }

  return `WebSocket connection failed: ${error.detail}`;
}

function isUpdateAliveStatusMessage(
  message: WebsocketMessage,
): message is UpdateAliveStatusMessage {
  return (
    message.type === 'update_alive_status' &&
    'clientUuid' in message &&
    typeof (message as { clientUuid: unknown }).clientUuid === 'string' &&
    'alive' in message &&
    typeof (message as { alive: unknown }).alive === 'boolean'
  );
}

function isPingMessage(message: WebsocketMessage): message is PingMessage {
  return message.type === 'ping';
}

function isPongMessage(message: WebsocketMessage): message is PongMessage {
  return message.type === 'pong';
}

class WsManager {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private listeners = new Set<WsMessageHandler>();
  private owners = 0;
  private generation = 0;
  private state: WsConnectionState = 'idle';

  retain(): void {
    this.owners += 1;
    void this.ensureConnected();
  }

  release(): void {
    if (this.owners === 0) return;

    this.owners -= 1;
    if (this.owners > 0) return;

    this.generation += 1;
    this.clearReconnectTimer();
    this.closeSocket();
    this.state = 'idle';
  }

  subscribe(listener: WsMessageHandler): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  send(message: WebsocketMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(JSON.stringify(convertObjectKeysToSnakeCase(message)));
    return true;
  }

  getState(): WsConnectionState {
    return this.state;
  }

  private async ensureConnected(): Promise<void> {
    if (this.owners === 0) return;
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) return;

    this.state = 'connecting';
    const connectGeneration = this.generation;
    const url = await this.buildWebsocketUrl();
    if (url === null || this.owners === 0 || connectGeneration !== this.generation) {
      if (this.owners === 0) {
        this.state = 'idle';
      }
      return;
    }

    const socket = new WebSocket(url);
    this.ws = socket;

    socket.onopen = () => {
      if (connectGeneration !== this.generation) {
        socket.close();
        return;
      }

      this.state = 'open';
      this.clearReconnectTimer();
    };

    socket.onmessage = (event) => {
      this.handleIncomingMessage(event.data);
    };

    socket.onerror = () => {
      if (this.owners > 0) {
        useErrorStore.getState().addError({
          severity: Severity.Warning,
          message: 'WebSocket transport error.',
        });
      }
    };

    socket.onclose = () => {
      if (this.ws === socket) {
        this.ws = null;
      }

      if (this.owners === 0 || connectGeneration !== this.generation) {
        this.state = 'idle';
        return;
      }

      this.state = 'idle';
      this.scheduleReconnect();
    };
  }

  private async buildWebsocketUrl(): Promise<string | null> {
    const apiUrl = apiClient.getApiUrl();
    if (!apiUrl) {
      return null;
    }

    const tokenResponse = await apiClient.get<UserAuthWsTokenResponse>('/user/auth/ws-token');
    if (isApiError(tokenResponse)) {
      useErrorStore.getState().addError({
        severity: Severity.Warning,
        message: getErrorMessage(tokenResponse),
      });
      return null;
    }

    const url = new URL(apiUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/user/ws';
    url.search = new URLSearchParams({ token: tokenResponse.token }).toString();
    return url.toString();
  }

  private handleIncomingMessage(data: string | ArrayBuffer | Blob): void {
    if (typeof data !== 'string') {
      useErrorStore.getState().addError({
        severity: Severity.Warning,
        message: 'Received unsupported WebSocket payload.',
      });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      useErrorStore.getState().addError({
        severity: Severity.Warning,
        message: 'Received invalid WebSocket payload.',
      });
      return;
    }

    const normalized = convertObjectKeysToCamelCase(parsed);
    if (!isWebsocketMessage(normalized)) {
      useErrorStore.getState().addError({
        severity: Severity.Warning,
        message: 'Received malformed WebSocket message.',
      });
      return;
    }

    if (normalized.type === 'error' && 'message' in normalized) {
      useErrorStore.getState().addError({
        severity: Severity.Warning,
        message: String((normalized as WebsocketErrorMessage).message),
      });
    }

    if (isPingMessage(normalized)) {
      this.send({ type: 'pong' });
      return;
    }

    if (isPongMessage(normalized)) {
      return;
    }

    if (isUpdateAliveStatusMessage(normalized)) {
      useLiveClientStore.getState().setClientAlive(
        normalized.clientUuid,
        normalized.alive,
      );
    }

    for (const listener of this.listeners) {
      listener(normalized);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      void this.ensureConnected();
    }, 3000);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return;

    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private closeSocket(): void {
    if (this.ws === null) return;

    const socket = this.ws;
    this.ws = null;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;

    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close(1000, 'Main shell unmounted');
    }
  }
}

export const wsManager = new WsManager();

// @flow strict

export interface ServerManager {
  listen(ServerOptions): Promise<ServerSocket>;
}

export interface ServerOptions {
  port: number;
  backlog?: number;
}

export interface ServerSocket {
  +localPort: number;
  // connections(): AsyncIterator<ClientSocket>;
}

export interface ClientManager {
  connect(ClientOptions): Promise<ClientSocket>;

  suspend(Client): void;
  resume(Client): void;
  close(Client): Promise<void>;
  closeImmediately(Client): Promise<void>;
  getBufferedAmount(Client): number;
  getStatus(Client): Status;
  write(Client, ArrayBuffer, options: ?WriteOptions): ?Promise<void>;
  read(Client): Promise<ArrayBuffer>;
  closed(Client): Promise<void>;
  opened(Client): Promise<void>;
  errored(Client): Promise<Error>;
}

export interface WriteOptions { byteOffset?: number; byteLength?: number }

export interface ClientOptions {
  host: string;
  port: number;
  useSecureTransport?: boolean;
}

export interface ClientSocket extends Client /*, AsyncIterator<ArrayBuffer>*/ {
  +host: string;
  +port: number;
  +ssl: boolean;
}

export interface Connection {
  +host: string;
  +port: number;
  +ssl: boolean;
}

export interface Client {
  +id: string;
}

export type Status = "connecting" | "open" | "closing" | "closed"

// @flow strict

export interface API {
  listen(ServerOptions): Promise<ServerSocket>;
  connect(ClientOptions): Promise<ClientSocket>;
}

export interface ServerOptions {
  port: number;
  backlog?: number;
}

export interface ServerSocket {
  +localPort: number;
  connections: AsyncIterator<ClientSocket>;
  close(): void;
}

export interface ClientOptions {
  host: string;
  port: number;
  useSecureTransport?: boolean;
}

export interface ClientSocket {
  +host: string;
  +port: number;
  +ssl: boolean;
  +readyState: Status;
  +bufferedAmount: number;

  +opened: Promise<void>;
  +closed: Promise<void>;

  write(ArrayBuffer, byteOffset?: number, byteLength?: number): Promise<void>;
  read(): Promise<ArrayBuffer>;

  suspend(): void;
  resume(): void;
  close(): Promise<void>;
  closeImmediately(Client): Promise<void>;
}

export type Status = "connecting" | "open" | "closing" | "closed"

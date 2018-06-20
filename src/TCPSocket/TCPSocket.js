// @flow strict

interface Client {
  +id: string;
}

interface Server {
  +id: string;
}

interface TCPServerSocket extends Server, AsyncIterator<TCPClientSocket> {
  +localPort: number;
}

type Status = "connecting" | "open" | "closing" | "closed"

interface TCPClientSocket extends Client, AsyncIterator<ArrayBuffer> {
  +host: string;
  +port: number;
  +ssl: boolean;
}

interface ClientManager {
  connect({ port: number, host?: string }): Promise<TCPClientSocket>;
  close(Client): void;
  closeImmediately(Client): void;
  suspend(Client): void;
  resume(Client): void;
  getBufferedAmount(Client): number;
  getStatus(Client): Status;
  write(
    Client,
    ArrayBuffer,
    options: ?{ byteOffset?: number, byteLength?: number }
  ): Promise<boolean>;
  read(Client): Promise<ArrayBuffer>;

  drained(Client): Promise<void>;
  errored(Client): Promise<Error>;
  opened(Client): Promise<void>;
}

interface ServerManager {
  server({ port: number, backlog?: number }): TCPServerSocket;

  onconnect(Server): Promise<TCPClientSocket>;
  close(Server): void;
}

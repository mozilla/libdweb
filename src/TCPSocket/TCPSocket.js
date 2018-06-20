// @flow

export interface UDPSocketManager {
  create(SocketOptions): Promise<UDPSocket>;
  close(UDPSocket): Promise<void>;
  send(
    UDPSocket,
    host: string,
    port: number,
    data: ArrayBuffer,
    size?: number
  ): Promise<number>;
  messages(UDPSocket): AsyncIterator<UDPMessage>;
  setMulticastLoopback(UDPSocket, boolean): Promise<void>;
  setMulticastInterface(UDPSocket, string): Promise<void>;
  addMembership(
    UDPSocket,
    address: string,
    multicastInterface?: string
  ): Promise<void>;
  dropMembership(
    UDPSocket,
    address: string,
    multicastInterface?: string
  ): Promise<void>;
}

export type FAMILY_INET = 1
export type FAMILY_INET6 = 2
export type FAMILY_LOCAL = 3
export type Family = FAMILY_INET | FAMILY_INET6 | FAMILY_LOCAL

export interface SocketAddress {
  host: string;
  port: number;
  family: Family;
}

export interface UDPSocket {
  id: string;
  address: SocketAddress;
}

export interface SocketOptions {
  host?: string;
  port?: number;
  loopbackOnly?: boolean;
  addressReuse?: boolean;
}

export interface UDPMessage {
  from: SocketAddress;
  data: ArrayBuffer;
}

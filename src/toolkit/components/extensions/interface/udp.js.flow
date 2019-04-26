// @flow

export interface UDPSocketManager {
  create(SocketOptions): Promise<UDPSocket>;
}

export type FAMILY_INET = 1
export type FAMILY_INET6 = 2
export type FAMILY_LOCAL = 3
export type Family = FAMILY_INET | FAMILY_INET6 | FAMILY_LOCAL

export interface SocketAddress {
  address: string;
  port: number;
  family: Family;
}

export interface UDPSocket {
  address: SocketAddress;
  close(): Promise<void>;
  send(
    host: string,
    port: number,
    data: ArrayBuffer,
    size?: number
  ): Promise<number>;
  messages(): AsyncIterator<UDPMessage>;

  setMulticastLoopback(boolean): Promise<void>;
  setMulticastInterface(string): Promise<void>;
  joinMulticast(address: string, multicastInterface?: string): Promise<void>;
  leaveMulticast(address: string, multicastInterface?: string): Promise<void>;
}

export interface SocketOptions {
  host?: string;
  port?: number;
  loopbackOnly?: boolean;
  addressReuse?: boolean;
}

export type UDPMessage = [ArrayBuffer, SocketAddress]

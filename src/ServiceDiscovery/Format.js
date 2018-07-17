// @flow

import type {
  Protocol,
  ServiceInfo,
  ServiceQuery,
  DiscoveryResult,
  ServiceAddress
} from "./ServiceDiscovery"

export interface ServiceID {
  serviceID: string;
}

export interface RegisteredService extends ServiceID {
  name: string;
  type: string;
  protocol: string;
  domain: string;
  port: number;
  attributes: ?{ [string]: string };
}
export interface DiscoveryID {
  discoveryID: number;
}

export type Inbox = "/libdweb/ServiceDiscovery/Discovery"

export type DiscoveryMessage =
  | { type: "onStartDiscoveryFailed", to: number, errorCode: number }
  | { type: "onStopDiscoveryFailed", to: number, errorCode: number }
  | { type: "onDiscoveryStopped", to: number }
  | { type: "onServiceLost", to: number, lost: DiscoveryResult }
  | { type: "onServiceFound", to: number, found: DiscoveryResult }

export interface HostService {
  startService(ServiceInfo): Promise<RegisteredService>;
  stopService(ServiceID): Promise<void>;
  resolveService(ServiceInfo): Promise<ServiceAddress[]>;
  startDiscovery(DiscoveryID, ServiceQuery): void;
  stopDiscovery(DiscoveryID): void;
}

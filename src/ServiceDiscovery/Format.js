// @flow

import type {
  Protocol,
  ServiceOptions,
  ServiceInfo,
  ServiceQuery
} from "./ServiceDiscovery"

export interface ServiceID {
  serviceID: string;
}

export interface RegisteredService {
  serviceID: ServiceID;
  info: ServiceInfo;
}
export interface DiscoveryID {
  discoveryID: number;
}

export type Inbox = "/libdweb/ServiceDiscovery/Discovery"

export type DiscoveryMessage =
  | { type: "onStartDiscoveryFailed", to: number, errorCode: number }
  | { type: "onStopDiscoveryFailed", to: number, errorCode: number }
  | { type: "onDiscoveryStopped", to: number }
  | { type: "onServiceLost", to: number, lost: ServiceInfo }
  | { type: "onServiceFound", to: number, found: ServiceInfo }

export interface HostService {
  startService(ServiceOptions): Promise<RegisteredService>;
  stopService(ServiceID): Promise<void>;
  startDiscovery(DiscoveryID, ServiceQuery): void;
  stopDiscovery(DiscoveryID): void;
}

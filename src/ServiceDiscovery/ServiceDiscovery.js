// @flow

export interface ServiceDiscovery {
  announce(ServiceOptions): Promise<Service>;
  discover(ServiceQuery): Discovery;
}

export type Protocol = "udp" | "tcp"

export interface ServiceOptions {
  name: string;
  type: string;
  protocol: Protocol;
  port?: number;
  attributes?: { [string]: string };
}

export interface ServiceInfo {
  name: string;
  type: string;
  domain: string;
  protocol: Protocol;
  host: string;
  port: number;
  addresses: string[];
  attributes: { [string]: string };
}

export interface Service extends ServiceInfo {
  expire(): Promise<void>;
}

export interface ServiceQuery {
  protocol: Protocol;
  type: string;
}

export interface Discovery extends AsyncIterator<DiscoveredService> {
  query: ServiceQuery;
}

export interface DiscoveredService extends ServiceInfo {
  lost: boolean;
}

// @flow

export interface ServiceDiscovery {
  announce(ServiceInfo): Promise<Service>;
  discover(ServiceQuery): Discovery;
}

export type Protocol = "udp" | "tcp"

export interface ServiceInfo {
  name: string;
  type: string;
  protocol: Protocol;
  host?: string;
  port?: number;
  attributes?: ?{ [string]: string };
}

export interface Service {
  name: string;
  type: string;
  domain: string;
  port: number;
  host: ?string;
  protocol: Protocol;
  attributes?: { [string]: string };

  expire(): Promise<void>;
}

export interface ServiceQuery {
  protocol: Protocol;
  type: string;
}

export interface Discovery extends AsyncIterator<DiscoveredService> {
  query: ServiceQuery;
}

export interface DiscoveredService {
  name: string;
  type: string;
  domain: string;
  protocol: string;
  addresses(): AsyncIterator<ServiceAddress>;
}

export interface ServiceAddress {
  host: string;
  address: string;
  port: number;
  attributes: { [string]: string };
}

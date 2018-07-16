// @flow

export interface mDNS {
  discover(serviceType: string): Discovery;
  announce(ServiceAnnouncement): Promise<AnnouncedService>;
  resolve(DiscoveredService): Promise<ServiceInfo>;
}

export interface Discovery extends AsyncIterator<DiscoveryEvent> {
  serviceType: string;
}

type DiscoveryEvent =
  | { type: "found", serviceInfo: DiscoveredService }
  | { type: "lost", serviceInfo: DiscoveredService }

export interface ServiceAnnouncement {
  serviceType: string;
  serviceName: string;
  domainName?: string;
  port: number;
  host?: string;
  address?: string;
  attributes?: { [string]: string };
}

export interface AnnouncedService {
  serviceType: string;
  serviceName: string;
  domainName: string;
  port: number;
  host?: string;
  address?: string;

  expire(): Promise<void>;
}

export interface DiscoveredService {
  serviceName: string;
  serviceType: string;
  domainName: string;
}

interface ServiceInfo {
  serviceName: string;
  serviceType: string;
  domainName: string;
  address: string;
  host: string;
  port: number;
  attributes: { [string]: string };
}

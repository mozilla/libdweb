// @flow

import type { Protocol, ServiceInfo } from "./ServiceDiscovery"

export interface RegisteredService {
  id: string;
  name: string;
  type: string;
  protocol: string;
  domain: string;
  port: number;
  attributes: ?{ [string]: string };
}

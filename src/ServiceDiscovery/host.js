// @flow
/*::
import { Components, Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {
  BaseContext,
  nsIDNSServiceDiscovery,
  nsIDNSServiceInfo,
  nsIDNSServiceDiscoveryListener,
  nsIDNSRegistrationListener,
  nsIDNSServiceResolveListener,
  nsICancelable,
  nsIPropertyBag2,
  nsISupports
} from "gecko"

import type {
  Protocol,
  ServiceDiscovery,
  ServiceInfo,
  ServiceQuery,
  ServiceAddress
} from "./ServiceDiscovery"

import type {
  RegisteredService,
  HostService,
  Inbox,
  DiscoveryMessage
} from "./Format"


interface Host {
  +ServiceDiscovery: HostService;
}
*/

const { setTimeout } = Cu.import("resource://gre/modules/Timer.jsm", {})

const mDNS = Cc[
  "@mozilla.org/toolkit/components/mdnsresponder/dns-sd;1"
].getService(Ci.nsIDNSServiceDiscovery)

const networkInfo = Cc["@mozilla.org/network-info-service;1"].createInstance(
  Ci.nsINetworkInfoService
)

// API boilerplate and hook up exports
global.ServiceDiscovery = class extends ExtensionAPI /*::<Host>*/ {
  /*::
  services:Map<string, Service>
  discoveries:Map<string, Discovery>
  */
  constructor(extension) {
    super(extension)
    this.services = new Map()
    this.discoveries = new Map()
  }
  onShutdown(reason) {
    const { services, discoveries } = this

    for (const service of services.values()) {
      service.terminate()
    }

    for (const discovery of discoveries.values()) {
      discovery.terminate()
    }
    services.clear()
    discoveries.clear()
  }
  getAPI(context) {
    const services = new Map()
    const discoveries = new Map()
    let nextID = 0

    return {
      ServiceDiscovery: {
        async startService(serviceInfo) {
          const id = `Service:${++nextID}`
          const service = new Service(id, serviceInfo)
          service.start()
          const info = await service.started
          services.set(id, service)
          return info
        },
        async stopService({ serviceID }) {
          const service = services.get(serviceID)
          if (service) {
            await service.stop()
            services.delete(service)
          } else {
            throw Error(`Service ${serviceID} not found`)
          }
        },
        resolveService(info) {
          return Resolver.resolve(context, info)
        },
        startDiscovery({ discoveryID }, info) {
          console.log(
            `ServiceDiscoveryHost.startDiscovery ${discoveryID}`,
            info
          )
          const discovery = new Discovery(context, discoveryID, info)
          discoveries.set(discoveryID, discovery)
          discovery.start()
        },
        stopDiscovery({ discoveryID }) {
          console.log(`ServiceDiscoveryHost.stopDiscovery ${discoveryID}`)
          const discovery = discoveries.get(discoveryID)
          if (discovery) {
            discovery.stop()
            discoveries.delete(discovery)
          }
        }
      }
    }
  }
}

class Service /*::implements nsIDNSRegistrationListener*/ {
  /*::
  info:ServiceInfo;
  id:string;

  address:?string;
  serviceName:?string;
  host:?string;
  port:?number;
  serviceType:string;
  domainName:?string;
  attributes:nsIPropertyBag2;

  started:Promise<RegisteredService>;
  stopped:Promise<void>;
  onstart:(RegisteredService) => void;
  onstarterror:(number) => void;
  onstop:() => void;
  onstoperror:(number) => void;
  registration:nsICancelable;
  */
  constructor(id, info) {
    this.id = id
    this.info = info
    this.serviceName = info.name
    this.host = info.host
    this.port = info.port == null ? -1 : info.port
    this.serviceType = parseServiceType(info)
    this.domainName = null
    this.attributes = PropertyBag.encode(info.attributes)
    this.started = new Promise((resolve, reject) => {
      this.onstart = resolve
      this.onstarterror = reject
    })
  }
  start() {
    try {
      console.log(`ServiceDiscoveryHost.registerService`, this)
      this.registration = mDNS.registerService(this, this)
    } catch (error) {
      console.error(`ServiceDiscoveryHost.registerService`, error)
      this.onstarterror(error)
    }
  }
  stop() {
    this.stopped = new Promise((resolve, reject) => {
      this.onstop = resolve
      this.onstoperror = reject
      this.registration.cancel(Cr.NS_OK)
    })
    return this.stopped
  }
  terminate() {
    this.registration.cancel(Cr.NS_BINDING_ABORTED)
  }
  onServiceRegistered(serviceInfo) {
    console.log(
      "ServiceDiscoveryHost.onServiceRegistered",
      Service.decode(serviceInfo)
    )
    const { serviceName: name, serviceType, port } = serviceInfo
    const { id } = this
    const attributes = Service.decodeAttributes(serviceInfo)
    const { type, protocol } = Service.decodeServiceType(serviceType)
    const domain = Service.decodeDomain(serviceInfo)
    this.onstart({
      serviceID: id,
      name,
      protocol,
      type,
      domain,
      port,
      attributes
    })
  }
  static resolveHost() {
    return new Promise((resolve, reject) => {
      networkInfo.getHostname({
        onGotHostname(hostname) {
          resolve(hostname.replace(/\s/g, "-") + ".local")
        },
        onGetHostnameFailed() {
          resolve("localhost")
        }
      })
    })
  }

  static decodeDomain(serviceInfo) {
    try {
      const { domainName } = serviceInfo
      return domainName === "local." ? "local" : domainName
    } catch (error) {
      return "local"
    }
  }
  static decodeServiceType(serviceType) {
    const { length } = serviceType
    const end = serviceType.charAt(length - 1) === "." ? length - 1 : length
    const start = serviceType.charAt(0) === "_" ? 1 : 0

    // Last 3 chars because serviceType will end with "tcp" or "udp" and both
    // contain 3 chars.
    const protocol =
      serviceType.substring(end - 3, end) === "tcp" ? "tcp" : "udp"
    // From start to end - 5 because it ends with "._tcp" or "._udp" and both
    // are 5 chars length.
    const type = serviceType.substring(start, end - 5)

    return { protocol, type }
  }
  static decodeAttributes(serviceInfo) {
    try {
      return PropertyBag.decode(serviceInfo.attributes)
    } catch (_) {
      return {}
    }
  }
  static decode(serviceInfo) {
    const { serviceName, serviceType } = serviceInfo
    return {
      serviceName,
      serviceType,
      domain: this.decodeDomain(serviceInfo),
      address: this.decodeField(serviceInfo, "address"),
      host: this.decodeField(serviceInfo, "host"),
      port: this.decodeField(serviceInfo, "port"),
      attributes: this.decodeAttributes(serviceInfo)
    }
  }
  static decodeField(serviceInfo, key, fallback = null) {
    try {
      switch (key) {
        case "host":
          return serviceInfo.host
        case "address":
          return serviceInfo.address
        case "port":
          return serviceInfo.port
        default:
          return fallback
      }
    } catch (_) {
      return fallback
    }
  }
  onRegistrationFailed(serviceInfo, errorCode) {
    console.log(
      "ServiceDiscoveryHost.onRegistrationFailed",
      Service.decode(serviceInfo),
      errorCode
    )
    this.onstarterror(errorCode)
  }
  onServiceUnregistered(serviceInfo) {
    console.log(
      "ServiceDiscoveryHost.onServiceUnregistered",
      Service.decode(serviceInfo)
    )
    this.onstop()
  }
  onUnregistrationFailed(serviceInfo, errorCode) {
    console.log(
      "ServiceDiscoveryHost.onUnregistrationFailed",
      Service.decode(serviceInfo),
      errorCode
    )
    this.onstoperror(errorCode)
  }
}

class Resolver {
  /*::
  context:BaseContext
  id:string
  serviceName:string
  serviceType:string
  domainName:string
  attributes:nsIPropertyBag2
  active:boolean

  result:ServiceAddress[]

  onResolve:(ServiceAddress[]) => void
  onError:(number) => void

  */
  constructor(
    context /*: BaseContext*/,
    id /*: string*/,
    active /*:boolean*/,
    serviceName /*: string*/,
    serviceType /*: string*/,
    domainName /*: string*/,
    attributes /*: nsIPropertyBag2*/,
    results /*:ServiceAddress[]*/,
    onResolve /*:(ServiceAddress[]) => void*/,
    onError /*:(number) => void*/
  ) {
    this.context = context
    this.id = id
    this.active = active
    this.serviceName = serviceName
    this.serviceType = serviceType
    this.domainName = domainName
    this.attributes = attributes
    this.result = results
    this.onResolve = onResolve
    this.onError = onError
  }
  static decodeServiceAddress(serviceInfo) {
    const { host, port, address } = serviceInfo
    const attributes = Service.decodeAttributes(serviceInfo)
    console.log("ResolvedAddress", host, port, address)
    return { host, port, address, attributes }
  }
  static resolve(context, info, timeout = 2000) {
    const serviceType = parseServiceType(info)
    const serviceName = info.name
    const domain = "local"
    const id = `${serviceName}._${serviceType}.${domain}`

    return new Promise((resolve, reject) => {
      const resolver = new Resolver(
        context,
        id,
        true,
        serviceName,
        serviceType,
        domain,
        PropertyBag.empty,
        [],
        resolve,
        reject
      )

      const listener /*:nsIDNSServiceResolveListener*/ = resolver
      mDNS.resolveService(resolver, listener)
      setTimeout(Resolver.onTimeout, timeout, resolver)
    })
  }
  static onTimeout(resolver) {
    resolver.onTimeout()
  }

  onTimeout() {
    console.log("ServiceDiscoveryHost.onTimout")
    if (this.active) {
      this.active = false
      if (this.result.length > 0) {
        this.onResolve(this.result)
      } else {
        this.onError(0)
      }
    }
  }
  onServiceResolved(serviceInfo) {
    console.log("ServiceDiscoveryHost.onServiceResolved", serviceInfo)
    if (this.active) {
      const address = Resolver.decodeServiceAddress(serviceInfo)
      this.result.push(address)
    }
  }
  onResolveFailed(_, errorCode) {
    console.log("ServiceDiscoveryHost.onResolveFailed", errorCode)
    if (this.active) {
      this.active = false
      this.onError(errorCode)
    }
  }
}

class Discovery {
  /*::
  id:number;
  serviceType:string;
  discovery:nsICancelable;
  context:BaseContext;
  active:boolean
  */
  terminate() {
    this.discovery.cancel(Cr.NS_BINDING_ABORTED)
  }
  stop() {
    return this.terminate()
  }
  constructor(context, discoveryID, info) {
    this.context = context
    this.id = discoveryID
    this.active = true
    this.serviceType = parseServiceType(info)
  }
  start() {
    this.discovery = mDNS.startDiscovery(this.serviceType, this)
  }
  onDiscoveryStarted(serviceType /*:string*/) {}
  static decodeService(serviceInfo) {
    const { serviceName: name, serviceType } = serviceInfo
    const { type, protocol } = Service.decodeServiceType(serviceType)
    const domain = Service.decodeDomain(serviceInfo)
    const attributes = Service.decodeAttributes(serviceInfo)
    return {
      name,
      type,
      protocol,
      domain,
      attributes
    }
  }
  send(message /*:DiscoveryMessage*/) {
    console.log(`ServiceDiscoveryHost.send ${this.id}`, message)
    this.context.parentMessageManager.sendAsyncMessage(
      "/libdweb/ServiceDiscovery/Discovery",
      message
    )
  }
  onServiceFound(serviceInfo) {
    console.log(`ServiceDiscoveryHost.onServiceFound ${this.id}`, serviceInfo)
    this.send({
      type: "onServiceFound",
      to: this.id,
      found: Discovery.decodeService(serviceInfo)
    })
  }
  onServiceLost(serviceInfo) {
    console.log(`ServiceDiscoveryHost.onServiceLost ${this.id}`, serviceInfo)
    this.send({
      type: "onServiceLost",
      to: this.id,
      lost: Discovery.decodeService(serviceInfo)
    })
  }
  onStartDiscoveryFailed(serviceType /*:string*/, errorCode /*:number*/) {
    console.log(
      `ServiceDiscoveryHost.onStartDiscoveryFailed ${this.id}`,
      serviceType,
      errorCode
    )

    this.send({
      type: "onStartDiscoveryFailed",
      to: this.id,
      errorCode: errorCode
    })
  }

  onDiscoveryStopped(serviceType /*:string*/) {
    console.log(
      `ServiceDiscoveryHost.onStopDiscoveryStopped ${this.id}`,
      serviceType
    )

    this.send({
      type: "onDiscoveryStopped",
      to: this.id
    })
  }
  onStopDiscoveryFailed(serviceType /*:string*/, errorCode /*:number*/) {
    console.log(
      `ServiceDiscoveryHost.onStopDiscoveryFailed ${this.id}`,
      serviceType,
      errorCode
    )

    this.send({
      type: "onStopDiscoveryFailed",
      to: this.id,
      errorCode
    })
  }
}

const parseServiceType = ({ type, protocol }) => `_${type}._${protocol}`

class PropertyBag {
  /*::
  static empty:nsIPropertyBag2
  */
  static decode(propertyBag /*:?nsIPropertyBag2*/) /*:{[string]:string}*/ {
    const attributes /*:Object*/ = Object.create(null)
    if (propertyBag instanceof Ci.nsIPropertyBag2) {
      const { enumerator } = propertyBag
      while (enumerator.hasMoreElements()) {
        const { name, value } = enumerator
          .getNext()
          .QueryInterface(Ci.nsIProperty)
        try {
          const attribute = value.toString()
          if (name !== "" || attribute !== "") {
            attributes[name] = attribute
          }
        } catch (_) {
          attributes[name] = null
        }
      }
    }
    return attributes
  }
  static encode(attributes /*:?{[string]:string}*/) /*:nsIPropertyBag2*/ {
    if (attributes) {
      const propertyBag = Cc["@mozilla.org/hash-property-bag;1"].createInstance(
        Ci.nsIWritablePropertyBag2
      )

      for (const name in attributes) {
        const value = attributes[name]
        propertyBag.setPropertyAsAUTF8String(name, value)
      }

      return propertyBag
    } else {
      return PropertyBag.empty
    }
  }
}
PropertyBag.empty = Cc["@mozilla.org/hash-property-bag;1"].createInstance(
  Ci.nsIWritablePropertyBag2
)

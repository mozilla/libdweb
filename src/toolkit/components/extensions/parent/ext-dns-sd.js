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
  ServiceOptions,
  ServiceDiscovery,
  ServiceInfo,
  ServiceQuery,
  RegisteredService,
  HostService,
  Inbox,
  DiscoveryMessage
} from "../interface/dns-sd.js"


interface Host {
  +ServiceDiscovery: HostService;
}
*/

const { setTimeout } = Cu.import("resource://gre/modules/Timer.jsm", {})

const env = Cc["@mozilla.org/process/environment;1"].getService(
  Ci.nsIEnvironment
)

const mDNS = Cc[
  "@mozilla.org/toolkit/components/mdnsresponder/dns-sd;1"
].getService(Ci.nsIDNSServiceDiscovery)

const networkInfo = Cc["@mozilla.org/network-info-service;1"].createInstance(
  Ci.nsINetworkInfoService
)

const networkInfoService = Cc[
  "@mozilla.org/network-info-service;1"
].createInstance(Ci.nsINetworkInfoService)

const listNetworkAddresses = () =>
  new Promise((resolve, reject) =>
    networkInfoService.listNetworkAddresses({
      onListedNetworkAddresses: resolve,
      onListNetworkAddressesFailed: reject
    })
  )

const getLocalAddresseses = async () => {
  const addresses = await listNetworkAddresses()
  return addresses.filter(address => {
    return (
      !address.includes("%p2p") && address != "127.0.0.1" // No WiFi Direct interfaces
    )
  })
}

const debug = env.get("MOZ_ENV") === "DEBUG"

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
        async startService(serviceOptions) {
          const id = `Service:${++nextID}`
          const serviceID = { serviceID: id }
          const service = new Service(serviceOptions)
          const info = await service.start()
          services.set(id, service)
          return { serviceID, info }
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
        startDiscovery({ discoveryID }, info) {
          debug &&
            console.log(
              `ServiceDiscoveryHost.startDiscovery ${discoveryID}`,
              info
            )
          const discovery = new Discovery(context, discoveryID, info)
          discoveries.set(discoveryID, discovery)
          discovery.start()
        },
        stopDiscovery({ discoveryID }) {
          debug &&
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

let localAddresses = null

class Info {
  static decodeResolved(
    serviceInfo /*:{serviceName:string, serviceType:string, domainName:string, host?:string, address?:string, port?:number, attributes?:nsIPropertyBag2}*/
  ) {
    const { serviceName: name, serviceType } = serviceInfo
    const { type, protocol } = Info.decodeServiceType(serviceType)
    const domain = Info.decodeDomain(serviceInfo)
    const attributes = Info.decodeAttributes(serviceInfo)
    const host = this.decodeHost(serviceInfo)
    const port = this.decodePort(serviceInfo)
    const addresses = this.decodeAddresses(serviceInfo)
    return {
      addresses,
      name,
      protocol,
      type,
      domain,
      port,
      host,
      attributes
    }
  }
  static decodeAddresses(serviceInfo) {
    try {
      const { address } = serviceInfo
      return address != null ? [address] : []
    } catch (_) {
      return []
    }
  }
  static decodeHost(serviceInfo) {
    try {
      const { host } = serviceInfo
      return host || ""
    } catch (error) {
      return ""
    }
  }
  static decodePort(serviceInfo) {
    try {
      return serviceInfo.port || -1
    } catch (error) {
      return -1
    }
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
}

class Service /*::implements nsIDNSRegistrationListener*/ {
  /*::
  info:?ServiceInfo;
  options:ServiceOptions;
  timeout:number;

  address:?string;
  serviceName:?string;
  host:?string;
  port:?number;
  serviceType:string;
  domainName:?string;
  attributes:nsIPropertyBag2;

  started:Promise<ServiceInfo>;
  stopped:Promise<void>;
  onstart:(ServiceInfo) => void;
  onstarterror:(Error) => void;
  onstop:() => void;
  onstoperror:(number) => void;
  registration:nsICancelable;
  */
  constructor(options) {
    this.timeout = 2000
    this.options = options
    this.serviceName = options.name
    this.host = null
    this.port = options.port == null ? -1 : options.port
    this.serviceType = parseServiceType(options)
    this.domainName = null
    this.attributes = PropertyBag.encode(options.attributes)
  }
  start() {
    return new Promise((resolve, reject) => {
      this.onstart = resolve
      this.onstarterror = reject
      try {
        debug && console.log(`ServiceDiscoveryHost.registerService`, this)
        this.registration = mDNS.registerService(this, this)
      } catch (error) {
        debug && console.error(`ServiceDiscoveryHost.registerService`, error)
        this.onstarterror(error)
      }
    })
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
    debug &&
      console.log(
        "ServiceDiscoveryHost.onServiceRegistered",
        Info.decode(serviceInfo)
      )
    this.resolveService(serviceInfo)
  }
  async resolveService(serviceInfo) {
    try {
      const info = await Resolver.resolve(serviceInfo)
      this.info = info

      if (info.addresses.length === 0) {
        if (localAddresses == null) {
          localAddresses = await getLocalAddresseses()
          info.addresses = localAddresses
        } else {
          info.addresses = localAddresses
        }
      }

      this.onstart(info)
    } catch (error) {
      this.terminate()
      this.onstarterror(error)
    }
  }

  onRegistrationFailed(serviceInfo, errorCode) {
    debug &&
      console.log(
        "ServiceDiscoveryHost.onRegistrationFailed",
        Info.decode(serviceInfo),
        errorCode
      )
    this.onstarterror(new Error(`Servire Registration Failed: ${errorCode}`))
  }
  onServiceUnregistered(serviceInfo) {
    debug &&
      console.log(
        "ServiceDiscoveryHost.onServiceUnregistered",
        Info.decode(serviceInfo)
      )
    this.onstop()
  }
  onUnregistrationFailed(serviceInfo, errorCode) {
    debug &&
      console.log(
        "ServiceDiscoveryHost.onUnregistrationFailed",
        Info.decode(serviceInfo),
        errorCode
      )
    this.onstoperror(errorCode)
  }
  onResolveFailed(_, errorCode) {
    debug && console.log("ServiceDiscoveryHost.onResolveFailed", errorCode)
    this.onstarterror(new Error(`Service resolution failed ${errorCode}`))
  }
}

class Resolver /*::implements nsIDNSServiceResolveListener*/ {
  /*::
  service:?ServiceInfo
  succeed:(ServiceInfo) => void
  fail:(Error) => void
  */
  constructor(succeed, fail) {
    this.succeed = succeed
    this.fail = fail
  }

  static resolve(serviceInfo /*:nsIDNSServiceInfo*/, time = 2000) {
    return new Promise((resolve, reject) => {
      const resolver = new Resolver(resolve, reject)
      resolver.resolve(serviceInfo, time)
    })
  }
  static onTimeout(resolver) {
    resolver.onTimeout()
  }

  resolve(serviceInfo /*:nsIDNSServiceInfo*/, timeout) {
    mDNS.resolveService(serviceInfo, this)
    setTimeout(Resolver.onTimeout, timeout, this)
  }
  onTimeout() {
    if (this.service) {
      this.succeed(this.service)
    } else {
      this.fail(new Error("Service resolution timeout"))
    }
  }

  onServiceResolved(serviceInfo) {
    debug && console.log("ServiceDiscoveryHost.onServiceResolved", serviceInfo)
    const { service } = this
    if (service == null) {
      this.service = Info.decodeResolved(serviceInfo)
    } else {
      const { address } = serviceInfo
      if (address) {
        service.addresses.push(address)
      }
    }
  }
  onResolveFailed(_, errorCode) {
    console.log("ServiceDiscoveryHost.onResolveFailed", errorCode)
    this.fail(new Error(`Service resolution failed ${errorCode}`))
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
  send(message /*:DiscoveryMessage*/) {
    debug && console.log(`ServiceDiscoveryHost.send ${this.id}`, message)
    this.context.parentMessageManager.sendAsyncMessage(
      "/libdweb/ServiceDiscovery/Discovery",
      message
    )
  }
  onServiceFound(serviceInfo) {
    debug &&
      console.log(`ServiceDiscoveryHost.onServiceFound ${this.id}`, serviceInfo)
    this.resolveService(serviceInfo)
  }
  async resolveService(serviceInfo) {
    try {
      const info = await Resolver.resolve(serviceInfo)
      this.send({
        type: "onServiceFound",
        to: this.id,
        found: info
      })
    } catch (error) {}
  }
  onServiceLost(serviceInfo) {
    debug &&
      console.log(`ServiceDiscoveryHost.onServiceLost ${this.id}`, serviceInfo)
    this.send({
      type: "onServiceLost",
      to: this.id,
      lost: Info.decodeResolved(serviceInfo)
    })
  }
  onStartDiscoveryFailed(serviceType /*:string*/, errorCode /*:number*/) {
    debug &&
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
    debug &&
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
    debug &&
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

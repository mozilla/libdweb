// @flow
/*::
import { Components, Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {
  BaseContext,
  nsIDNSServiceDiscovery,
  nsIDNSServiceInfo,
  nsIDNSServiceDiscoveryListener,
  nsIDNSRegistrationListener,
  nsICancelable,
  nsIPropertyBag2,
  nsISupports
} from "gecko"

import type {
  Protocol,
  ServiceDiscovery,
  ServiceInfo,
  ServiceQuery
} from "./ServiceDiscovery"

import type {
  RegisteredService
} from "./Format"


interface Host {
  +ServiceDiscovery: ServiceDiscoveryHost;
}

interface ServiceDiscoveryHost {
  startService(ServiceInfo):Promise<RegisteredService>;
  stopService(string):Promise<void>;
}
*/

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
          const info = await service.start()
          services.set(id, service)
          return info
        },
        async stopService(id) {
          const service = services.get(id)
          if (service) {
            await service.stop()
            services.delete(service)
          } else {
            throw Error(`Service not found`)
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
    this.serviceType = `_${info.type}._${info.protocol}`
    this.domainName = null
    this.attributes = PropertyBag.encode(info.attributes)
  }
  start() {
    console.log(`ServiceDiscoveryHost.registerService`, this)
    this.started = new Promise((resolve, reject) => {
      try {
        this.onstart = resolve
        this.onstarterror = reject
        this.registration = mDNS.registerService(this, this)
      } catch (error) {
        console.error(`ServiceDiscoveryHost.registerService`, error)
        reject(error)
      }
    })
    return this.started
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
    const { serviceName: name, serviceType, domainName, port } = serviceInfo
    const { id } = this
    const attributes = Service.decodeAttributes(serviceInfo)
    const { type, protocol } = Service.decodeServiceType(serviceType)
    const domain = domainName === "local." ? "local" : domainName
    this.onstart({
      id,
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

  static decodeServiceType(serviceType) {
    const { length } = serviceType
    const end = serviceType.charAt(length - 1) === "." ? length - 1 : length
    const start = serviceType.charAt(0) === "_" ? 1 : 0

    // Last 3 chars because serviceType will end with "tcp" or "udp" and both
    // contain 3 chars.
    const protocol = serviceType.substring(end - 3, end)
    // From start to end - 5 because it ends with "._tcp" or "._udp" and both
    // are 5 chars length.
    const type = serviceType.substring(start, end - 5)

    return { protocol, type }
  }
  static decodeAttributes(serviceInfo) {
    try {
      return PropertyBag.decode(serviceInfo.attributes)
    } catch (_) {
      return null
    }
  }
  static decode(serviceInfo) {
    const { serviceName, serviceType, domainName } = serviceInfo
    return {
      serviceName,
      serviceType,
      domainName,
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
  id:string
  */
  static resolve(id, info, timeout = 2000) {
    const resolver = new Resolver()
    resolver.id = id
    mDNS.resolveService(info, resolver)
    setTimeout(Resolver.onTimeout, timeout, resolver)
  }
  static onTimeout(resolver) {
    this.onTimeout()
  }

  onTimeout() {}
  onServiceResolved() {}
  onResolveFailed() {}
}
class Discovery {
  /*::
  discovery:nsICancelable;
  */
  terminate() {
    this.discovery.cancel(Cr.NS_BINDING_ABORTED)
  }
  //   constructor(serviceType) {
  //     this.serviceType = serviceType
  //     this.results = []
  //   }
  //   start() {
  //     return new Promise((resolve, reject) => {
  //       this.resolve = resolve
  //       this.reject = reject
  //       this.discovery = mDNS.startDiscovery(this.serviceType, this)
  //     })
  //   }
  onDiscoveryStarted(serviceType /*:string*/) {}
  onDiscoveryStopped(serviceType /*:string*/) {
    //     this.resolve(this.results)
  }
  onServiceFound(serviceInfo /*:nsIDNSServiceInfo*/) {
    //     console.log("found", serviceInfo)
    //     this.results.push({
    //       type: "found",
    //       service: {
    //         name: serviceInfo.serviceName,
    //         type: serviceInfo.serviceType,
    //         domain: serviceInfo.domainName
    //       }
    //     })
  }
  onServiceLost(serviceInfo /*:nsIDNSServiceInfo*/) {
    //     console.log("lost", serviceInfo)
    //     this.results.push({
    //       type: "lost",
    //       service: {
    //         name: serviceInfo.serviceName,
    //         type: serviceInfo.serviceType,
    //         domain: serviceInfo.domainName
    //       }
    //     })
  }
  onStartDiscoveryFailed(serviceType /*:string*/, errorCode /*:number*/) {
    //     this.reject(errorCode)
  }
  onStopDiscoveryFailed(serviceType /*:string*/, errorCode /*:number*/) {
    //     this.reject(errorCode)
  }
}

// class ResolveListener {
//   onServiceResolved(serviceInfo) {
//     console.log(`onServiceResolved`, Service.decode(serviceInfo))
//   }
//   onResolveFailed(serviceInfo) {
//     console.log(`onResolveFailed`, Service.decode(serviceInfo))
//   }
// }

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
          attributes[name] = value.toString()
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

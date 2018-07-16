// @flow
/*::
import { Components, Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {
  Protocol,
  ServiceDiscovery,
  ServiceInfo,
  ServiceQuery,
  Discovery,
  ServiceAddress,
  DiscoveredService
} from "./ServiceDiscovery"

import type {
  RegisteredService
} from "./Format"

interface Host {
  +ServiceDiscovery: ServiceDiscovery;
}
*/

const { ExtensionUtils } = Cu.import(
  "resource://gre/modules/ExtensionUtils.jsm",
  {}
)

const { ExtensionError } = ExtensionUtils

global.ServiceDiscovery = class extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    const services = new WeakMap()
    const discoveries = new WeakMap()

    const ServiceAPI = exportClass(
      context.cloneScope,
      class ServiceAPI {
        /*::
        name: string;
        type: string;
        domain: string;
        port: number;
        host: ?string;
        protocol: Protocol;
        attributes: ?{ [string]: string };
        */
        constructor() {
          throw TypeError("Illegal constructor")
        }
        expire() /*: Promise<void>*/ {
          const state = services.get(this)
          if (!state) {
            return notFound
          } else if (state.expired) {
            return voidPromise
          } else {
            return context.wrapPromise(stopService(state.id))
          }
        }
      }
    )

    const DiscoveryAPI = exportClass(
      context.cloneScope,
      AsAsyncIterator(
        class Discovery {
          /*::
          @@asyncIterator: () => self
          query: ServiceQuery;
          */
          constructor() {
            throw TypeError("Illegal constructor")
          }
          next() {
            const client = discoveries.get(this)
            if (client) {
              return client.next()
            } else {
              return notFound
            }
          }
          return() {
            const client = discoveries.get(this)
            if (client) {
              return client.return()
            } else {
              return notFound
            }
          }
        }
      )
    )

    const DiscoveredServiceAPI = exportClass(
      context.cloneScope,
      class DiscoveredServiceAPI {
        /*::
        name: string;
        type: string;
        domain: string;
        protocol: string;
        */
        constructor() {
          throw TypeError("Illegal constructor")
        }
        addresses() /*: AsyncIterator<ServiceAddress>*/ {
          throw 1
        }
      }
    )

    const { cloneScope, childManager } = context

    const startService = (
      serviceInfo /*:ServiceInfo*/
    ) /*:Promise<RegisteredService>*/ =>
      childManager.callParentAsyncFunction("ServiceDiscovery.startService", [
        serviceInfo
      ])

    const stopService = (id /*:string*/) /*:Promise<void>*/ =>
      childManager.callParentAsyncFunction("ServiceDiscovery.stopService", [id])

    const notFound = Promise.reject(
      ExtensionError("Host for the object not found")
    )
    const voidPromise = Promise.resolve()

    return {
      ServiceDiscovery: {
        tcp: "tcp",
        udp: "udp",
        announce: serviceInfo =>
          new cloneScope.Promise(async (resolve, reject) => {
            try {
              const protocol = parseProtocol(serviceInfo.protocol)
              serviceInfo.attributes = parseAttributes(serviceInfo.attributes)

              const info = await startService(serviceInfo)

              const { id, name, type, port, domain, attributes } = info
              const service = exportInstance(cloneScope, ServiceAPI, {
                name,
                type,
                protocol,
                port,
                domain,
                attributes: Cu.cloneInto(attributes, cloneScope)
              })
              services.set(service, new ServiceState(id))

              resolve(service)
            } catch (error) {
              reject(ExtensionError(error))
            }
          }),
        discover(serviceQuery /*:ServiceQuery*/) {
          const protocol = parseProtocol(serviceQuery.protocol)
          const { type } = serviceQuery
          const discovery = exportInstance(context.cloneScope, DiscoveryAPI)
          const query = Cu.cloneInto(serviceQuery, context.cloneScope)
          const unwrapped = Cu.waiveXrays(discovery)
          Reflect.defineProperty(unwrapped, "query", { value: query })
          const client = new DiscoveryClient(cloneScope)
          discoveries.set(discovery, client)
          return discovery
        }
      }
    }
  }
}

class DiscoveryClient {
  /*::
  scope:Object
  requests:{resolve({done:false, value:DiscoveredService}|{done:true}):void, reject(Error):void}[]
  responses:Promise<{done:false, value:DiscoveredService}>[]
  done:null|Promise<{done:true, value:void}>
  */
  constructor(scope) {
    this.scope = scope
    this.requests = []
    this.responses = []
  }
  contiune(serviceInfo) {
    const { requests, done, responses, scope } = this
    if (done) {
      throw Error("Received serviceInfo event after discovery was ended")
    } else {
      const request = requests.shift()
      const nextIteration = Cu.cloneInto({ done: false, value: serviceInfo })
      if (request) {
        request.resolve(nextIteration)
      } else {
        responses.push(scope.Promise.resolve(nextIteration))
      }
    }
  }
  break() {
    const { requests } = this
    this.done = this.scope.Promise.resolve(doneIteration)
    for (const request of requests) {
      request.resolve(doneIteration)
    }
  }
  throw(error) {
    const { requests } = this
    this.done = this.scope.Promise.reject(error)
    for (const request of requests) {
      request.reject(error)
    }
  }
  next() {
    const { responses, requests, done, scope } = this
    if (done) {
      return done
    } else {
      const response = responses.shift()
      if (response) {
        return response
      } else {
        return new scope.Promise((resolve, reject) => {
          requests.push({ resolve, reject })
        })
      }
    }
  }
  return() {
    const { responses, requests, done, scope } = this
    if (done) {
      return done
    } else {
      this.break()
      return scope.Promise.resolve(doneIteration)
    }
  }
}

class ServiceState {
  /*::
  expired:boolean
  id:string
  */
  constructor(id) {
    this.id = id
    this.expired = false
  }
}

const parseProtocol = protocol => {
  switch (protocol) {
    case "udp":
    case "tcp":
      return protocol
    default:
      throw new ExtensionError(
        `Invalid protocol ${protocol} must be either "udp" or "tcp"`
      )
  }
}

const parseAttributes = (attributes) /*:?{[string]:string}*/ => {
  if (!attributes) {
    return null
  } else {
    const result /*:Object*/ = Object.create(null)
    for (const key in attributes) {
      result[key] = String(attributes[key])
    }
    return result
  }
}

const exportClass = /*::<b, a:Class<b>>*/ (
  scope /*:Object*/,
  constructor /*:a*/
) /*:a*/ => {
  const clone = Cu.exportFunction(constructor, scope)
  const unwrapped = Cu.waiveXrays(clone)
  const prototype = Cu.waiveXrays(Cu.createObjectIn(scope))

  const source = constructor.prototype
  for (const key of Reflect.ownKeys(constructor.prototype)) {
    if (key !== "constructor") {
      const descriptor = Reflect.getOwnPropertyDescriptor(source, key)
      Reflect.defineProperty(
        prototype,
        key,
        Cu.waiveXrays(
          Cu.cloneInto(descriptor, scope, {
            cloneFunctions: true
          })
        )
      )
    }
  }

  Reflect.defineProperty(unwrapped, "prototype", {
    value: prototype
  })
  Reflect.defineProperty(prototype, "constructor", {
    value: unwrapped
  })

  return clone
}

const exportInstance = /*::<a:Object, b:a>*/ (
  scope,
  constructor /*:Class<b>*/,
  properties /*::?:a*/
) /*:b*/ => {
  const instance /*:any*/ = properties
    ? Cu.cloneInto(properties, scope)
    : Cu.cloneInto({}, scope)
  Reflect.setPrototypeOf(
    Cu.waiveXrays(instance),
    Cu.waiveXrays(constructor).prototype
  )
  return instance
}

const AsAsyncIterator = constructor => {
  const $Symbol /*:any*/ = Symbol
  const prototype /*:Object*/ = constructor.prototype
  prototype[$Symbol.asyncIterator] = function() {
    return this
  }
  return constructor
}

const doneIteration = Object.freeze({ done: true })

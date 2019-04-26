// @flow
/*::
import { Components, Cu, Cr, Ci, Cc, nsIMessageListenerManager, ExtensionAPI } from "gecko"
import type { BaseContext } from "gecko"
import type {
  Protocol,
  ServiceDiscovery,
  ServiceOptions,
  ServiceInfo,
  ServiceQuery,
  Discovery,
  DiscoveredService,
  RegisteredService,
  HostService,
  Inbox,
  DiscoveryMessage,
  ServiceID
} from "../interface/dns-sd.js"


interface Host {
  +ServiceDiscovery: ServiceDiscovery;
}
*/

{
  const { ExtensionUtils } = Cu.import(
    "resource://gre/modules/ExtensionUtils.jsm",
    {}
  )

  const { ExtensionError, getUniqueId } = ExtensionUtils

  const getAPIClasses = (context, refs) => {
    class DiscoveredService {
      /*::
      name: string;
      type: string;
      domain: string;
      protocol: Protocol;
      lost:boolean;
      addresses:string[];
      attributes:{[string]:string};
      */
      constructor() {
        throw TypeError("Illegal constructor")
      }
    }
    class Service {
      /*::
      name: string;
      type: string;
      domain: string;
      port: number;
      host: ?string;
      protocol: Protocol;
      attributes: { [string]: string };
      */
      constructor() {
        throw TypeError("Illegal constructor")
      }
      expire() /*: Promise<void>*/ {
        const client = refs.Service.get(this)
        if (!client) {
          return notFoundPromise()
        } else {
          return client.expire()
        }
      }
    }
    class Discovery {
      /*::
      @@asyncIterator: () => self
      query: ServiceQuery;
      */
      constructor() {
        throw TypeError("Illegal constructor")
      }
      next() {
        const client = refs.Discovery.get(this)
        if (client) {
          return client.next()
        } else {
          return notFoundPromise()
        }
      }
      return() {
        const client = refs.Discovery.get(this)
        if (client) {
          return client.return()
        } else {
          return notFoundPromise()
        }
      }
    }

    const notFound = new context.cloneScope.RangeError(
      "Host for the object not found"
    )
    let notFoundPromiseCache = null

    const notFoundPromise = () => {
      if (notFoundPromiseCache) {
        return notFoundPromiseCache
      } else {
        notFoundPromiseCache = context.cloneScope.Promise.reject(notFound)
        return notFoundPromiseCache
      }
    }

    return {
      Service: exportClass(context.cloneScope, Service),
      Discovery: exportAsyncIterator(context.cloneScope, Discovery),
      DiscoveredService: exportClass(context.cloneScope, DiscoveredService)
    }
  }

  const getServiceDiscoveryAPI = (context) /*:ServiceDiscovery*/ => {
    const { cloneScope } = context
    const refs = {
      Service: new WeakMap(),
      Discovery: new WeakMap(),
      DiscoveredService: new WeakMap()
    }
    const subscribers = {
      Discovery: new Map()
    }
    const host = HostAPI.new(context)
    const api = getAPIClasses(context, refs)

    class ServiceClient {
      /*::
      expired:boolean
      serviceID:ServiceID
      */
      constructor(serviceID) {
        this.serviceID = this.serviceID
        this.expired = false
      }
      static announce(options) {
        return new cloneScope.Promise(async (resolve, reject) => {
          try {
            const protocol = parseProtocol(options.protocol)
            options.attributes = parseAttributes(options.attributes)

            const { serviceID, info } = await host.startService(options)

            const service = exportInstance(cloneScope, api.Service, {
              name: info.name,
              type: info.type,
              protocol: info.protocol,
              port: info.port,
              domain: info.domain,
              host: info.host,
              addresses: Cu.cloneInto(info.addresses, cloneScope),
              attributes: Cu.cloneInto(info.attributes, cloneScope)
            })
            refs.Service.set(service, new ServiceClient(serviceID))

            resolve(service)
          } catch (error) {
            reject(new cloneScope.Error(error.message))
          }
        })
      }
      expire() {
        if (this.expired) {
          return voidPromise
        } else {
          return context.wrapPromise(host.stopService(this.serviceID))
        }
      }
    }

    class DiscoveryClient {
      /*::
      id:number
      serviceQuery:ServiceQuery
      scope:Object
      requests:{resolve({done:false, value:DiscoveredService}|{done:true}):void, reject(Error):void}[]
      responses:Promise<{done:false, value:DiscoveredService}>[]
      done:Promise<{done:true, value:void}>
      isDone:boolean
      onBreak:({done:true}) => void
      onError:(Error) => void
      */
      static discover(serviceQuery /*:ServiceQuery*/) {
        const protocol = parseProtocol(serviceQuery.protocol)
        const { type } = serviceQuery
        const id = getUniqueId()
        const discovery = exportInstance(context.cloneScope, api.Discovery)
        const query = Cu.cloneInto(serviceQuery, context.cloneScope)
        const unwrapped = Cu.waiveXrays(discovery)
        Reflect.defineProperty(unwrapped, "query", { value: query })
        const client = new DiscoveryClient(cloneScope, id)
        refs.Discovery.set(discovery, client)
        subscribers.Discovery.set(id, client)
        client.start(serviceQuery)
        return discovery
      }
      constructor(scope, id) {
        this.id = id
        this.scope = scope
        this.isDone = false
        this.requests = []
        this.responses = []
      }
      start(serviceQuery) {
        this.done = new this.scope.Promise((resolve, reject) => {
          this.onBreak = resolve
          this.onError = reject

          host.startDiscovery({ discoveryID: this.id }, serviceQuery)
        })
      }
      found(serviceInfo) {
        this.continue(decodeDiscoveredService(serviceInfo, false))
      }
      lost(serviceInfo) {
        this.continue(decodeDiscoveredService(serviceInfo, true))
      }
      continue(service) {
        const { requests, isDone, responses, scope } = this
        if (isDone) {
          throw Error("Received serviceInfo event after discovery was ended")
        } else {
          const request = requests.shift()
          const nextIteration = Cu.cloneInto(
            { done: false /*::,value:service*/ },
            cloneScope
          )
          Reflect.defineProperty(Cu.unwaiveXrays(nextIteration), "value", {
            value: service
          })

          if (request) {
            request.resolve(nextIteration)
          } else {
            responses.push(scope.Promise.resolve(nextIteration))
          }
        }
      }
      break() {
        const { requests } = this
        for (const request of requests) {
          request.resolve(doneIteration)
        }
        subscribers.Discovery.delete(this.id)
        this.onBreak(doneIteration)
      }
      throw(error) {
        const { requests } = this
        for (const request of requests) {
          request.reject(error)
        }
        this.onError(error)
      }
      next() {
        const { responses, requests, done, isDone, scope } = this
        const response = responses.shift()
        if (response) {
          return response
        } else if (isDone) {
          return done
        } else {
          return new scope.Promise((resolve, reject) => {
            requests.push({ resolve, reject })
          })
        }
      }
      return() {
        const { isDone, done, id } = this
        if (!isDone) {
          this.isDone = true
          host.stopDiscovery({ discoveryID: id })
        }
        return done
      }
      update(message) {
        switch (message.type) {
          case "onStopDiscoveryFailed": {
            return this.throw(
              new context.cloneScope.Error(
                `Failed to stop discovery ${message.errorCode}`
              )
            )
          }
          case "onStartDiscoveryFailed": {
            return this.throw(
              new context.cloneScope.Error(
                `Failed to start discovery ${message.errorCode}`
              )
            )
          }
          case "onDiscoveryStopped": {
            return this.break()
          }
          case "onServiceLost": {
            return this.lost(message.lost)
          }
          case "onServiceFound": {
            return this.found(message.found)
          }
        }
      }

      static close() {
        inbox.removeMessageListener(INBOX, DiscoveryClient)
      }
      static subscribe() {
        context.callOnClose(DiscoveryClient)
        inbox.addMessageListener(INBOX, DiscoveryClient.receiveMessage)
      }
      static receiveMessage({ data }) {
        const client = subscribers.Discovery.get(data.to)
        if (client) {
          client.update(data)
        } else {
          throw new RangeError(
            `Unable to receive Discovery message for ${data.to}`
          )
        }
      }
    }

    const decodeDiscoveredService = (info, lost) =>
      Cu.cloneInto(
        {
          lost,
          name: info.name,
          type: info.type,
          domain: info.domain,
          protocol: info.protocol,
          host: info.host,
          port: info.port,
          addresses: Cu.cloneInto(info.addresses, context.cloneScope),
          attributes: Cu.cloneInto(info.attributes, context.cloneScope)
        },
        context.cloneScope
      )

    const voidPromise = cloneScope.Promise.resolve()
    const doneIteration = Cu.cloneInto({ done: true }, context.cloneScope)
    Reflect.preventExtensions(Cu.waiveXrays(doneIteration))

    const INBOX /*:Inbox*/ = "/libdweb/ServiceDiscovery/Discovery"
    const inbox /*:nsIMessageListenerManager<{name:Inbox, data:DiscoveryMessage}>*/ =
      context.childManager.messageManager

    DiscoveryClient.subscribe()

    return {
      TCP: "tcp",
      UDP: "udp",
      announce: ServiceClient.announce,
      discover: DiscoveryClient.discover
    }
  }

  class HostAPI /*::implements HostService*/ {
    /*::
    context:BaseContext
    */
    constructor(context) {
      this.context = context
    }
    static new(context) /*:HostService*/ {
      return new this(context)
    }
    startService(
      serviceInfo /*:ServiceOptions*/
    ) /*:Promise<RegisteredService>*/ {
      return this.context.childManager.callParentAsyncFunction(
        "ServiceDiscovery.startService",
        [serviceInfo]
      )
    }
    stopService(address) /*:Promise<void>*/ {
      return this.context.childManager.callParentAsyncFunction(
        "ServiceDiscovery.stopService",
        [address]
      )
    }
    startDiscovery(discoveryID, query /*:ServiceQuery*/) {
      return this.context.childManager.callParentFunctionNoReturn(
        "ServiceDiscovery.startDiscovery",
        [discoveryID, query]
      )
    }
    stopDiscovery(discoveryID) {
      this.context.childManager.callParentFunctionNoReturn(
        "ServiceDiscovery.stopDiscovery",
        [discoveryID]
      )
    }
  }

  global.ServiceDiscovery = class extends ExtensionAPI /*::<Host>*/ {
    getAPI(context) {
      return {
        ServiceDiscovery: getServiceDiscoveryAPI(context)
      }
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

  const exportAsyncIterator = /*::<b:Object, a:Class<b>>*/ (
    scope /*:Object*/,
    constructor /*:a*/
  ) /*:a*/ => {
    const $Symbol /*:any*/ = Symbol
    const prototype /*:Object*/ = constructor.prototype
    prototype[$Symbol.asyncIterator] = function() {
      return this
    }
    return exportClass(scope, constructor)
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

  const parseAttributes = (attributes) /*:{[string]:string}*/ => {
    if (!attributes) {
      return {}
    } else {
      const result /*:Object*/ = Object.create(null)
      for (const key in attributes) {
        result[key] = String(attributes[key])
      }
      return result
    }
  }
}

// @flow strict

/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"

import type {BaseContext, nsIUDPSocket, nsIUDPSocketListener, nsINetAddr} from "gecko"
import type {
  UDPSocket,
  UDPSocketManager,
  UDPMessage,
  SocketAddress,
  SocketOptions,
  Family
} from "../interface/udp"

interface Host {
  +UDPSocket: UDPSocketManager;
}
*/
Cu.importGlobalProperties(["URL"])

{
  const getAPIClasses = context => {
    class UDPSocketClient /*::implements UDPSocket*/ {
      /*::
      __id:Number
      address:SocketAddress
      */
      constructor() {
        throw TypeError("Illegal constructor")
      }
      close() {
        return new context.cloneScope.Promise(async (resolve, reject) => {
          try {
            await context.childManager.callParentAsyncFunction(
              "UDPSocket.close",
              [this.__id]
            )
            resolve()
          } catch (e) {
            reject(e.message)
          }
        })
      }
      send(
        host /*: string*/,
        port /*: number*/,
        data /*: ArrayBuffer*/,
        size /*::?: number*/
      ) /*: Promise<number>*/ {
        return new context.cloneScope.Promise(async (resolve, reject) => {
          try {
            const result = await context.childManager.callParentAsyncFunction(
              "UDPSocket.send",
              [this.__id, host, port, data, size]
            )
            resolve(result)
          } catch (e) {
            reject(e.message)
          }
        })
      }
      messages() {
        const client = exportInstance(context.cloneScope, Messages, {
          __socketId: this.__id
        })
        return client
      }
      setMulticastLoopback(flag /*:boolean*/) /*: Promise<void>*/ {
        return new context.cloneScope.Promise(async (resolve, reject) => {
          try {
            await context.childManager.callParentAsyncFunction(
              "UDPSocket.setMulticastLoopback",
              [this.__id, flag]
            )
            resolve()
          } catch (e) {
            reject(e.message)
          }
        })
      }
      setMulticastInterface(
        multicastInterface /*:string*/
      ) /*: Promise<void>*/ {
        return new context.cloneScope.Promise(async (resolve, reject) => {
          try {
            await context.childManager.callParentAsyncFunction(
              "UDPSocket.setMulticastInterface",
              [this.__id, multicastInterface]
            )
            resolve()
          } catch (e) {
            reject(e.message)
          }
        })
      }
      joinMulticast(
        address /*: string*/,
        multicastInterface /*::?: string*/
      ) /*: Promise<void>*/ {
        return new context.cloneScope.Promise(async (resolve, reject) => {
          try {
            await context.childManager.callParentAsyncFunction(
              "UDPSocket.joinMulticast",
              [this.__id, address, multicastInterface]
            )
            resolve()
          } catch (e) {
            reject(e.message)
          }
        })
      }
      leaveMulticast(
        address /*: string*/,
        multicastInterface /*::?: string*/
      ) /*: Promise<void>*/ {
        return new context.cloneScope.Promise(async (resolve, reject) => {
          try {
            await context.childManager.callParentAsyncFunction(
              "UDPSocket.leaveMulticast",
              [this.__id, address, multicastInterface]
            )
            resolve()
          } catch (e) {
            reject(e.message)
          }
        })
      }
    }

    class MessagesClient {
      /*::
      @@asyncIterator: () => self
      __socketId: Number
      */
      constructor() {
        throw TypeError("Illegal constructor")
      }
      next() {
        return context.childManager.callParentAsyncFunction(
          "UDPSocket.pollMessages",
          [this.__socketId]
        )
      }
      return() {
        return context.childManager.callParentAsyncFunction(
          "UDPSocket.returnHost",
          [this.__socketId]
        )
      }
    }

    const Messages = exportAsyncIterator(context.cloneScope, MessagesClient)

    return {
      UDPSocket: exportClass(context.cloneScope, UDPSocketClient),
      UDPSocketMessages: Messages
    }
  }

  const getAPI = context => {
    const api = getAPIClasses(context)

    return {
      FAMILY_INET: Ci.nsINetAddr.FAMILY_INET,
      FAMILY_INET6: Ci.nsINetAddr.FAMILY_INET6,
      FAMILY_LOCAL: Ci.nsINetAddr.FAMILY_LOCAL,

      create: config =>
        new context.cloneScope.Promise(async (resolve, reject) => {
          const options = config || noOptions

          try {
            const socket = await context.childManager.callParentAsyncFunction(
              "UDPSocket.createSocket",
              [options]
            )
            const client = exportInstance(context.cloneScope, api.UDPSocket, {
              __id: socket.id,
              address: {
                address: socket.address,
                port: socket.port,
                family: socket.family
              }
            })
            resolve(client)
          } catch (e) {
            reject(e.message)
          }
        })
    }
  }

  global.UDPSocket = class extends ExtensionAPI /*::<Host>*/ {
    getAPI(context) {
      return { UDPSocket: getAPI(context) }
    }
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

  const noOptions = {}
}

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
  const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})
  const { OS } = Cu.import("resource://gre/modules/osfile.jsm", {})
  const { ExtensionUtils } = Cu.import(
    "resource://gre/modules/ExtensionUtils.jsm",
    {}
  )

  const { ExtensionError } = ExtensionUtils

  const $Symbol /*:any*/ = Symbol

  class IOError extends ExtensionError {
    static throw(message) /*:empty*/ {
      const self = new this(message)
      throw self
    }
  }

  const wrapUnprivilegedFunction = (f, scope) => input =>
    f(Cu.cloneInto(input, scope))

  const getAPIClasses = (context, refs, sockets) => {
    class UDPSocketClient /*::implements UDPSocket*/ {
      /*::
      address:SocketAddress
      */
      constructor() {
        throw TypeError("Illegal constructor")
      }
      close() {
        const socket = refs.sockets.get(this)
        if (socket) {
          sockets.delete(socket)
          socket.close()
          return voidPromise
        } else {
          throw notFoundPromise()
        }
      }
      send(
        host /*: string*/,
        port /*: number*/,
        data /*: ArrayBuffer*/,
        size /*::?: number*/
      ) /*: Promise<number>*/ {
        const socket = refs.sockets.get(this)
        if (socket) {
          const n = socket.send(
            host,
            port,
            new Uint8Array(data),
            size || data.byteLength
          )
          return context.cloneScope.Promise.resolve(n)
        } else {
          return notFoundPromise()
        }
      }
      messages() {
        const socket = refs.sockets.get(this)
        if (socket) {
          const host = new MessagesHost(socket)
          const client = exportInstance(context.cloneScope, Messages)
          refs.messages.set(client, host)
          socket.asyncListen(host)
          return client
        } else {
          return notFoundPromise()
        }
      }
      setMulticastLoopback(flag /*:boolean*/) /*: Promise<void>*/ {
        const socket = refs.sockets.get(this)
        if (socket) {
          socket.multicastLoopback = flag
          return voidPromise
        } else {
          return notFoundPromise()
        }
      }
      setMulticastInterface(
        multicastInterface /*:string*/
      ) /*: Promise<void>*/ {
        const socket = refs.sockets.get(this)
        if (socket) {
          socket.multicastInterface = multicastInterface
          return voidPromise
        } else {
          return notFoundPromise()
        }
      }
      joinMulticast(
        address /*: string*/,
        multicastInterface /*::?: string*/
      ) /*: Promise<void>*/ {
        const socket = refs.sockets.get(this)
        if (socket) {
          socket.joinMulticast(address, multicastInterface)
          return voidPromise
        } else {
          return notFoundPromise()
        }
      }
      leaveMulticast(
        address /*: string*/,
        multicastInterface /*::?: string*/
      ) /*: Promise<void>*/ {
        const socket = refs.sockets.get(this)
        if (socket) {
          socket.leaveMulticast(address, multicastInterface)
          return voidPromise
        } else {
          return notFoundPromise()
        }
      }
    }

    class MessagesClient {
      /*::
      @@asyncIterator: () => self
      */
      constructor() {
        throw TypeError("Illegal constructor")
      }
      next() {
        const host = refs.messages.get(this)
        if (host) {
          return host.next()
        } else {
          return notFoundPromise()
        }
      }
      return() {
        const host = refs.messages.get(this)
        if (host) {
          return host.return()
        } else {
          return notFoundPromise()
        }
      }
    }

    class MessagesHost {
      /*::
      socket:nsIUDPSocket
      requests:{resolve({done:false, value:UDPMessage}|{done:true}):void, reject(Error):void}[]
      responses:Promise<{done:false, value:UDPMessage}>[]
      isDone:boolean
      done:Promise<{done:true, value:void}>
      scope:Object
      */
      constructor(socket) {
        this.socket = socket
        this.isDone = false
        this.requests = []
        this.responses = []
        this.scope = context.cloneScope
      }
      onPacketReceived(socket, message) {
        const { scope } = this
        debug && console.log(`TCPSocket/onPacketReceived`, message)
        const { address, port, family } = message.fromAddr
        this.continue(
          Cu.cloneInto(
            [
              message.rawData.buffer,
              Cu.cloneInto({ address, port, family }, scope)
            ],
            scope
          )
        )
      }
      onStopListening(socket, status) {
        debug && console.log(`TCPSocket/onStopListening`, status)

        if (status === Cr.NS_BINDING_ABORTED) {
          return this.break()
        } else {
          return this.throw(
            new Error(`Socket was closed with error: ${status}`)
          )
        }
      }
      continue(value) {
        const { requests, isDone, responses, scope } = this
        if (isDone) {
          throw Error("Received message after iteration was done")
        } else {
          debug && console.log("UDPSocket.MessagesHost.continue", value)
          const nextIteration = Cu.cloneInto(
            { done: false /*::,value:value*/ },
            context.cloneScope
          )
          Reflect.defineProperty(Cu.unwaiveXrays(nextIteration), "value", {
            value
          })

          const request = requests.shift()
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
      }
      throw(error) {
        const { requests } = this
        for (const request of requests) {
          request.reject(error)
        }
      }
      next() {
        const { responses, requests, done, isDone } = this
        const response = responses.shift()
        if (response) {
          return response
        } else if (isDone) {
          return done
        } else {
          return new context.cloneScope.Promise((resolve, reject) => {
            requests.push({ resolve, reject })
          })
        }
      }
      return() {
        const { isDone, done } = this
        if (!isDone) {
          this.isDone = true
          this.socket.close()
        }
        return doneIteration
      }
    }

    const voidPromise /*:Promise<void>*/ = context.cloneScope.Promise.resolve()
    const doneIteration = Cu.cloneInto({ done: true }, context.cloneScope)
    const notFound = new ExtensionError("Host for the object not found")
    let notFoundPromiseCache = null

    const notFoundPromise = () => {
      if (notFoundPromiseCache) {
        return notFoundPromiseCache
      } else {
        notFoundPromiseCache = context.cloneScope.Promise.reject(notFound)
        return notFoundPromiseCache
      }
    }

    const Messages = exportAsyncIterator(context.cloneScope, MessagesClient)

    return {
      UDPSocket: exportClass(context.cloneScope, UDPSocketClient),
      UDPSocketMessages: Messages
    }
  }

  const getAPI = (context, refs, sockets) => {
    const api = getAPIClasses(context, refs, sockets)

    return {
      FAMILY_INET: Ci.nsINetAddr.FAMILY_INET,
      FAMILY_INET6: Ci.nsINetAddr.FAMILY_INET6,
      FAMILY_LOCAL: Ci.nsINetAddr.FAMILY_LOCAL,

      create: config =>
        new context.cloneScope.Promise((resolve, reject) => {
          const options = config || noOptions
          try {
            const socket = Cc[
              "@mozilla.org/network/udp-socket;1"
            ].createInstance(Ci.nsIUDPSocket)

            if (options.host != null) {
              socket.init2(
                options.host,
                options.port || -1,
                null,
                options.addressReuse != false
              )
            } else {
              socket.init(
                options.port || -1,
                options.loopbackOnly != false,
                null,
                options.addressReuse != false
              )
            }

            const { address, port, family } = socket.localAddr
            const client /*:UDPSocket*/ = exportInstance(
              context.cloneScope,
              api.UDPSocket,
              {
                address: Cu.cloneInto(
                  { address, port, family },
                  context.cloneScope
                )
              }
            )
            sockets.add(socket)
            refs.sockets.set(client, socket)
            resolve(client)
          } catch (error) {
            reject(new ExtensionError(error))
          }
        })
    }
  }

  global.UDPSocket = class extends ExtensionAPI /*::<Host>*/ {
    getAPI(context) {
      const refs = {
        sockets: new WeakMap(),
        messages: new WeakMap()
      }
      const sockets = new Set()

      context.callOnClose({
        close() {
          for (const socket of sockets) {
            socket.close()
          }
          sockets.clear()
        }
      })

      return { UDPSocket: getAPI(context, refs, sockets) }
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
  const debug = true
}

const { ExtensionError } = ExtensionUtils

const AsAsyncIterator = constructor => {
  const $Symbol /*:any*/ = Symbol
  const prototype /*:Object*/ = constructor.prototype
  prototype[$Symbol.asyncIterator] = function() {
    return this
  }
  return constructor
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

global.TCPSocket = class extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    const servers = new Map()
    const connections = new Map()
    const connectionInternal = new Map()

    const derefSocket = client => {
      return connections.get(client.__id)
    }

    const TCPClient = exportClass(
      context.cloneScope,
      class TCPClient {
        constructor() {
          throw TypeError("Illegal constructor")
        }
        get host() {
          return derefSocket(this).host
        }
        get port() {
          return derefSocket(this).port
        }
        get ssl() {
          return derefSocket(this).ssl
        }
        get readyState() {
          return derefSocket(this).readyState
        }
        get bufferedAmount() {
          return derefSocket(this).bufferedAmount
        }
        get opened() {
          return derefSocket(this).opened
        }
        get closed() {
          return derefSocket(this).closed
        }
        write(buffer, byteOffset, byteLength) {
          return new context.cloneScope.Promise(async (resolve, reject) => {
            try {
              const result = await context.childManager.callParentAsyncFunction(
                "TCPSocket.write",
                [this.__id, buffer, byteOffset, byteLength]
              )
              resolve()
            } catch (e) {
              reject(e.toString())
            }
          })
        }
        read() {
          return new context.cloneScope.Promise(async resolve => {
            const internal = connectionInternal.get(this.__id)
            if (internal.buffer.length > 0) {
              resolve(internal.buffer.shift())
            } else {
              internal.ondata = () => {
                resolve(internal.buffer.shift())
              }
            }
          })
        }
        suspend() {
          context.childManager.callParentAsyncFunction("TCPSocket.suspend", [
            this.__id
          ])
        }
        resume() {
          context.childManager.callParentAsyncFunction("TCPSocket.resume", [
            this.__id
          ])
        }
        close() {
          return new context.cloneScope.Promise(async resolve => {
            await context.childManager.callParentAsyncFunction(
              "TCPSocket.close",
              [this.__id]
            )
            resolve()
          })
        }
        closeImmediately() {
          return new context.cloneScope.Promise(async resolve => {
            await context.childManager.callParentAsyncFunction(
              "TCPSocket.closeImmediately",
              [this.__id]
            )
            resolve()
          })
        }
        upgradeToSecure() {
          context.childManager.callParentAsyncFunction(
            "TCPSocket.upgradeToSecure",
            [this.__id]
          )
        }
      }
    )

    const done = Cu.cloneInto({ done: true }, context.cloneScope)
    const next = value => {
      const result = Cu.cloneInto({ done: false }, context.cloneScope)
      Reflect.defineProperty(result, "value", { value })
      return result
    }

    const createClientSocket = (socket /*:TCPSocketAPI*/) /*:ClientSocket*/ => {
      const internals = {
        buffer: []
      }
      socket.opened = new context.cloneScope.Promise(resolve => {
        internals.onOpened = resolve
      })
      socket.closed = new context.cloneScope.Promise(resolve => {
        internals.onClosed = resolve
      })
      connections.set(socket.id, socket)
      connectionInternal.set(socket.id, internals)

      const client = exportInstance(context.cloneScope, TCPClient, {
        __id: socket.id
      })
      return client
    }

    const TCPConnections = exportClass(
      context.cloneScope,
      AsAsyncIterator(
        class TCPConnections {
          constructor() {
            throw TypeError("Illegal constructor")
          }
          next() {
            return new context.cloneScope.Promise(async (resolve, reject) => {
              try {
                const socket = await context.childManager.callParentAsyncFunction(
                  "TCPSocket.pollServer",
                  [this.__id]
                )
                if (socket) {
                  resolve(next(createClientSocket(socket)))
                } else {
                  resolve(done)
                }
              } catch (e) {
                reject(e.toString())
              }
            })
          }
          return() {
            context.childManager.callParentAsyncFunction(
              "TCPSocket.closeServer",
              [this.__id]
            )
            return done
          }
        }
      )
    )

    const TCPServer = exportClass(
      context.cloneScope,
      class TCPServer {
        /*::
        connections:AsyncIterator<ClientSocket>
        */
        constructor() {
          throw TypeError("Illegal constructor")
        }
        get localPort() {
          return servers.get(this.__id).localPort
        }
        get closed() {
          return servers.get(this.__id).closed
        }
        get connections() {
          const connections = exportInstance(
            context.cloneScope,
            TCPConnections,
            { __id: this.__id }
          )
          return connections
        }
        close() {
          context.childManager.callParentAsyncFunction(
            "TCPSocket.closeServer",
            [this.__id]
          )
        }
      }
    )

    const pollEvents = async () => {
      const events = await context.childManager.callParentAsyncFunction(
        "TCPSocket.pollEventQueue",
        []
      )
      events.forEach(event => {
        const type = event[0]

        if (type === "serverClose") {
          const server = servers.get(event[1])
          server.onClosed()
          return
        }

        const socket = Object.assign(connections.get(event[1].id), event[1])
        const internal = connectionInternal.get(event[1].id)
        connections.set(socket.id, socket)
        switch (type) {
          case "open":
            internal.onOpened()
            break
          case "close":
            internal.onClosed()
            break
          case "data":
            internal.buffer.push(event[2])
            if (internal.ondata) {
              internal.ondata()
              internal.ondata = null
            }
            break
        }
      })
      pollEvents()
    }
    pollEvents()

    return {
      TCPSocket: {
        listen: options =>
          new context.cloneScope.Promise(async (resolve, reject) => {
            try {
              const parentServer = await context.childManager.callParentAsyncFunction(
                "TCPSocket.listen",
                [options]
              )

              const internals = {
                localPort: parentServer.localPort,
                connections: []
              }
              internals.closed = new context.cloneScope.Promise(resolve => {
                internals.onClosed = resolve
              })
              servers.set(parentServer.id, internals)
              const server = exportInstance(context.cloneScope, TCPServer, {
                __id: parentServer.id
              })
              resolve(server)
            } catch (e) {
              reject(e)
            }
          }),
        connect: options =>
          new context.cloneScope.Promise(async (resolve, reject) => {
            try {
              const socket = await context.childManager.callParentAsyncFunction(
                "TCPSocket.connect",
                [options]
              )
              resolve(createClientSocket(socket))
            } catch (e) {
              reject(e)
            }
          })
      }
    }
  }
}

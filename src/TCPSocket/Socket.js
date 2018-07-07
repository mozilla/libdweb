// @flow strict

/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type { BaseContext } from "gecko"
import type {
  ServerManager,
  Server,
  ServerOptions,
  ServerSocket,

  ClientManager,
  Client,
  ClientOptions,
  ClientSocket,

  Status,
} from "./TCPSocket"

interface Host {
  +TCPServerSocket: ServerManager;
  +TCPClientSocket: ClientManager;
}
*/
Cu.importGlobalProperties(["URL"])
const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})
const { TCPSocket, TCPServerSocket } = Cu.getGlobalForObject(Services)
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

class Supervisor /*::<delegate>*/ {
  /*::
  id:number
  delegates:{[string]:delegate}
  */
  constructor() {
    const delegates /*:Object*/ = Object.create(null)
    this.id = 0
    this.delegates = delegates
  }
  async start /*::<in1, in2, in3>*/(
    init /*:(Supervisor<delegate>, string, in1, in2, in3) => Promise<delegate> | delegate*/,
    a1 /*:in1*/,
    a2 /*:in2*/,
    a3 /*:in3*/
  ) /*:Promise<delegate>*/ {
    const id = `${++this.id}`
    const child = await init(this, id, a1, a2, a3)
    this.delegates[id] = child
    return child
  }
  async stop /*::<in1, in2, out>*/(
    f /*:(delegate, in1, in2) => out*/,
    a1 /*:in1*/,
    a2 /*:in2*/
  ) {
    const { delegates } = this
    for (const id in delegates) {
      const delegate = delegates[id]
      delete delegates[id]
      await f(delegate, a1, a2)
    }
  }
  stopped(id /*:string*/) {
    delete this.delegates[id]
  }
  terminate /*::<in1, in2, out>*/(
    f /*:(delegate, in1, in2) => out*/,
    id /*:string*/,
    a1 /*:in1*/,
    a2 /*:in2*/
  ) /*:out*/ {
    const { delegates } = this
    const dalegate = delegates[id]
    if (dalegate) {
      delete delegates[id]
      return f(dalegate, a1, a2)
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
  delegate /*::<in1, in2, out>*/(
    f /*:(delegate, in1, in2) => out*/,
    id /*:string*/,
    a1 /*:in1*/,
    a2 /*:in2*/
  ) /*:out*/ {
    const { delegates } = this
    const dalegate = delegates[id]
    if (dalegate) {
      return f(dalegate, a1, a2)
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
}

class TCPServer /*::implements ServerSocket*/ {
  /*::
  id: string;
  localPort: number;
  */
  constructor(id /*: string*/, localPort /*: number*/) {
    this.id = id
    this.localPort = localPort
  }
  static new(id /*:string*/, localPort /*:number*/) /*:ServerSocket*/ {
    return new this(id, localPort)
  }
}

class ServerHandler {
  /*::
  id:string
  supervisor:Supervisor<ServerHandler>
  socket:TCPServerSocket
  server:TCPServer
  errored:Promise<Error>
  onerror:(Error) => void
  */
  constructor(
    id /*:string*/,
    supervisor /*:Supervisor<ServerHandler>*/,
    socket /*:TCPServerSocket*/,
    server /*:TCPServer*/
  ) {
    this.id = id
    this.supervisor = supervisor
    this.socket = socket
    this.server = server
  }

  static terminate(self) {
    self.socket.close()
    ServerHandler.delete(self)
  }
  static delete(self) {
    delete self.supervisor
    delete self.id
    delete self.socket
    delete self.server
    delete self.errored
  }
  static serve(supervisor, id, options) {
    console.log(">>>>>", TCPServerSocket)
    const socket = new TCPServerSocket(
      options.port,
      { binaryType: "arraybuffer" },
      options.backlog || undefined
    )
    const server = new TCPServer(id, socket.localPort)
    const self = new ServerHandler(id, supervisor, socket, server)
    self.errored = new Promise(resolve => (self.onerror = resolve))

    const eventHandler = event => ServerHandler.handleEvent(self, event)

    socket.onerror = eventHandler
    socket.onconnect = eventHandler

    return self
  }
  static handleEvent(self, event) {
    switch (event.type) {
      case "error": {
        console.log("Server error", event)
        return ServerHandler.onerror(self, event)
      }
      case "connection": {
        console.log("Server connection", event)
        return ServerHandler.onconnect(self, event)
      }
    }
  }
  static onconnect(self, event) {}
  static onerror(self, event) {
    self.supervisor.stopped(self.id)
    ServerHandler.delete(self)
  }
  static close({ socket }) {
    return socket.close()
  }
}

class ClientHandler {
  /*::
  id:string
  supervisor:Supervisor<ClientHandler>
  socket:TCPSocket
  client:ClientSocket
  readRequests:{resolve(ArrayBuffer):void, reject(Error):void}[]
  availableChunks:ArrayBuffer[]

  onclose:() => void
  onopen:() => void
  onerror:(Error) => void
  errored:Promise<Error>
  closed:Promise<void>
  opened:Promise<void>
  */

  static handleEvent(self, event) {
    switch (event.type) {
      case "open": {
        return self.onopen()
      }
      case "closed": {
        self.onclose()
        return ClientHandler.terminate(self)
      }
      case "data": {
        return ClientHandler.ondata(self, event.data)
      }
      case "error": {
        return ClientHandler.onerror(self, event)
      }
    }
  }

  static async connect(supervisor, id, options) {
    const { host, port, useSecureTransport } = options
    console.log(
      "Client.connect",
      host,
      port,
      useSecureTransport,
      TCPSocket.toString()
    )

    const socket = new TCPSocket(host, port, {
      binaryType: "arraybuffer",
      useSecureTransport: !!useSecureTransport
    })

    console.log("Client.socket", socket)

    try {
      await new Promise((resolve, reject) => {
        socket.onopen = resolve
        socket.onerror = reject
      })

      const client = new TCPClient(id, socket.host, socket.port, socket.ssl)
      const self = new ClientHandler()

      self.id = id
      self.supervisor = supervisor
      self.socket = socket
      self.client = client
      self.errored = new Promise(resolve => (self.onerror = resolve))

      const eventHandler = event => ClientHandler.handleEvent(self, event)
      socket.onclose = eventHandler
      socket.ondata = eventHandler
      socket.onerror = eventHandler

      return self
    } catch (error) {
      return IOError.throw(`${error.name}: ${error.message}`)
    }
  }

  static terminate(self) {
    self.supervisor.stopped(self.id)
    ClientHandler.delete(self)
  }

  static opened(handler) {
    return handler.opened
  }
  static closed(handler) {
    return handler.closed
  }
  static errored(handler) {
    return handler.errored
  }
  static bufferedAmount({ socket }) {
    return socket.bufferedAmount
  }
  static readyState({ socket }) {
    return socket.readyState
  }
  static delete(handler) {
    delete handler.socket
    delete handler.client
    delete handler.supervisor
    delete handler.id
  }
  static close(handler) {
    const { socket } = handler
    ClientHandler.delete(handler)
    socket.close()
  }
  static async close(handler) {
    const { socket } = handler
    ClientHandler.delete(handler)
    socket.close()
  }
  static async closeImmediately(handler) {
    const { socket } = handler
    ClientHandler.delete(handler)
    socket.closeImmediately()
  }
  static suspend({ socket }) {
    socket.suspend()
  }
  static resume({ socket }) {
    socket.resume()
  }
  static async write(handler, buffer, options) /*:Promise<void>*/ {
    const { socket } = handler
    let wrote = false
    if (options) {
      const byteOffset = options.byteOffset || 0
      if (options.byteLength != null) {
        wrote = socket.send(buffer, byteOffset, options.byteLength)
      } else {
        wrote = socket.send(buffer, byteOffset)
      }
    } else {
      wrote = socket.send(buffer)
    }

    if (!wrote) {
      return ClientHandler.ondrain(handler)
    }
  }
  static async read(self) /*: Promise<ArrayBuffer>*/ {
    const { availableChunks, readRequests, socket } = self
    if (availableChunks.length > 0) {
      return availableChunks.shift()
    } else if (socket.readyState === "closed") {
      return IOError.throw("Socket is closed")
    } else {
      return await new Promise((resolve, reject) => {
        readRequests.push({ resolve, reject })
      })
    }
  }
  static ondata(self, data) {
    const { readRequests, availableChunks } = self
    if (readRequests.length > 0) {
      readRequests.shift().resolve(data)
    } else {
      availableChunks.push(data)
    }
  }
  static ondrain({ socket }) /*: Promise<void>*/ {
    return new Promise(resolve => {
      socket.ondrain = () => {
        resolve()
        socket.ondrain = null
      }
    })
  }
  static onerror(self, event) {
    const names = []
    for (const name in event) {
      names.push(name)
    }
    console.log(
      "TCPClient.onerror",
      event.message,
      names,
      String(event),
      event.error,
      event.stack
    )
    self.onerror(event)
  }
}

class TCPClient /*::implements ClientSocket*/ {
  /*::
  id:string;
  host:string;
  port:number;
  ssl:boolean;
  */
  constructor(
    id /*:string*/,
    host /*:string*/,
    port /*:number*/,
    ssl /*:boolean*/
  ) {
    this.id = id
    this.host = host
    this.port = port
    this.ssl = ssl
  }
}

global.TCP = class extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    debug && console.log("!!!!!!!!! getAPI")
    const serverManager = new Supervisor()
    const clientManager = new Supervisor()

    context.callOnClose({
      close() {
        serverManager.stop(ServerHandler.terminate)
        clientManager.stop(ClientHandler.closeImmediately)
      }
    })

    return {
      TCPServerSocket: {
        serve: async options => {
          const handler = await serverManager.start(
            ServerHandler.serve,
            options
          )
          return handler.server
        },
        close: async ({ id }) => serverManager.delegate(ServerHandler.close, id)
      },
      TCPClientSocket: {
        connect: async options => {
          const handler = await clientManager.start(
            ClientHandler.connect,
            options
          )
          return handler.client
        },
        suspend: ({ id }) => clientManager.delegate(ClientHandler.suspend, id),
        resume: ({ id }) => clientManager.delegate(ClientHandler.resume, id),
        close: ({ id }) => clientManager.delegate(ClientHandler.close, id),
        closeImmediately: ({ id }) =>
          clientManager.delegate(ClientHandler.closeImmediately, id),
        getBufferedAmount: ({ id }) =>
          clientManager.delegate(ClientHandler.bufferedAmount, id),
        getStatus: ({ id }) =>
          clientManager.delegate(ClientHandler.readyState, id),
        write: ({ id }, data, options) =>
          clientManager.delegate(ClientHandler.write, id, data, options),
        read: ({ id }) => clientManager.delegate(ClientHandler.read, id),
        closed: ({ id }) => clientManager.delegate(ClientHandler.closed, id),
        opened: ({ id }) => clientManager.delegate(ClientHandler.opened, id),
        errored: ({ id }) => clientManager.delegate(ClientHandler.errored, id)
      }
    }
  }
}

const debug = true

// class RemoteIterator {
//   /*::
//   socket:UDPSocket;
//   promise: ?{resolve:({value:UDPMessage, done:false}|{done:true}) => void, reject:Error => void}
//   done:boolean
//   */
//   constructor(socket /*:UDPSocket*/) {
//     this.socket = socket
//     this.done = false
//   }
//   onPacketReceived(socket, message) {
//     debug &&
//       console.log(`TCPSocket/onPacketReceived ${this.socket.id}`, message)
//     this.continue({
//       from: Address.from(message.fromAddr),
//       data: message.rawData.buffer
//     })
//   }
//   onStopListening(socket, status) {
//     debug && console.log(`TCPSocket/onStopListening ${this.socket.id}`, status)

//     if (status === Cr.NS_BINDING_ABORTED) {
//       return this.abort(null)
//     } else {
//       return this.abort(new Error(`Socket was closed with error: ${status}`))
//     }
//   }
//   continue(value) {
//     const { promise, done } = this
//     this.promise = null
//     debug &&
//       console.log("UDPSocketClient.AsyncIterator.continue", promise, value)
//     if (promise && !done) {
//       promise.resolve({ value, done: false })
//     }
//   }
//   abort(reason) {
//     const { promise, done } = this
//     this.promise = null
//     debug && console.log("UDPSocketClient.AsyncIterator.break", promise)
//     if (promise && !done) {
//       if (reason) {
//         promise.reject(reason)
//       } else {
//         promise.resolve({ done: true })
//       }
//     }
//     this.done = true
//   }

//   getAPI(context) /*:AsyncIterator<UDPMessage>*/ {
//     const iterator = Cu.cloneInto(
//       {
//         /*::
//         @@asyncIterator: () => iterator,
//         */
//         next: () => {
//           return new context.cloneScope.Promise((resolve, reject) => {
//             if (this.done) {
//               resolve(Cu.cloneInto({ done: true }, context.cloneScope))
//             } else {
//               this.promise = {
//                 resolve: wrapUnprivilegedFunction(resolve, context.cloneScope),
//                 reject: wrapUnprivilegedFunction(reject, context.cloneScope)
//               }
//             }
//           })
//         },
//         return: () => {
//           new context.cloneScope.Promise((resolve, reject) => {
//             const done = { done: true }
//             const { promise } = this
//             if (promise) {
//               this.promise = null
//               this.done = true
//               promise.resolve(done)
//             }
//             resolve(Cu.cloneInto(done, context.cloneScope))
//           })
//         }
//       },
//       context.cloneScope,
//       {
//         cloneFunctions: true
//       }
//     )

//     const unwrappedIterator /*:Object*/ = Cu.waiveXrays(iterator)
//     unwrappedIterator[$Symbol.asyncIterator] = Cu.exportFunction(function() {
//       return this
//     }, context.cloneScope)

//     return iterator
//   }
// }

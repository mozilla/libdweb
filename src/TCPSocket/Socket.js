// @flow strict

/*::
import { Components, Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {
  BaseContext,
  nsresult,
  nsISupports,
  nsISocketTransport,
  TCPReadyState,
  nsIInputStream,
  nsIOutputStream,
  nsIBinaryOutputStream,
  nsIBinaryInputStream,
  nsIAsyncInputStream,
  nsIInputStreamPump
} from "gecko"
import type {
  ServerManager,
  ServerOptions,
  ServerSocket,
  Connection,

  ClientManager,
  ClientOptions,
  ClientSocket,
  WriteOptions,

  Status,
} from "./TCPSocket"

interface Host {
  +TCPServerSocket: ServerManager;
  +TCPClientSocket: ClientManager;
}
*/
Cu.importGlobalProperties(["URL"])
const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})
const { OS } = Cu.import("resource://gre/modules/osfile.jsm", {})
const { TCPSocket, TCPServerSocket } = Cu.getGlobalForObject(OS)
const { ExtensionUtils } = Cu.import(
  "resource://gre/modules/ExtensionUtils.jsm",
  {}
)

// const url = Components.stack.filename.split("->").pop()

// console.log(">>>", new URL(`./TCP.js`, url).href)
// const { newTCPSocket, newTCPServerSocket } = Cu.import(
//   new URL(`./TCP.js?a=5`, url),
//   {}
// )

const { ExtensionError } = ExtensionUtils

const AsAsyncIterator = constructor => {
  const $Symbol /*:any*/ = Symbol
  const prototype /*:Object*/ = constructor.prototype
  prototype[$Symbol.asyncIterator] = function() {
    return this
  }
  return constructor
}

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
    init /*:(Supervisor<delegate>, string, in1, in2, in3) => Promise<delegate>*/,
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

class Server {
  /*::
  socket:{close():void}
  errored:Promise<Error>
  closed:Promise<void>
  onerrored:(Error) => void
  onclosed:() => void
  context:BaseContext
  connections:AsyncIterator<Connection>
  createConnection:(TCPSocketAdapter) => Connection
  localPort:number
  connectionObservers:{next({done:false, value:Connection}|{done:true}):void, throw(Error):void}[]
  */
  constructor(
    socket /*:{close():void}*/,
    localPort /*:number*/,
    createConnection /*:(TCPSocketAdapter) => Connection*/
  ) {
    this.socket = socket
    this.localPort = localPort
    this.createConnection = createConnection
  }

  onSocketAccepted(server, client) {
    this.onconnect(client)
  }
  onStopListening(server, status) {
    switch (status) {
      case Cr.NS_OK:
        return this.onclose(status)
      case Cr.NS_BINDING_ABORTED: {
        return this.onclose(status)
      }
      default: {
        return this.onerror(status)
      }
    }
  }
  addConnectionObserver(resolve, reject) {
    this.connectionObservers.push({ next: resolve, throw: reject })
  }
  cancelConnectionObservers() {
    for (const observer of this.connectionObservers.splice(0)) {
      observer.next({ done: true })
    }
  }
  failConnecitonObservers(error) {
    for (const observer of this.connectionObservers.splice(0)) {
      observer.throw(error)
    }
  }

  terminate() {
    this.socket.close()
    this.delete()
  }
  delete() {
    delete this.socket
    delete this.errored
  }
  static async new(
    options /*:ServerOptions*/,
    createConnection /*:(TCPSocketAdapter) => Connection*/
  ) /*: Promise<Server>*/ {
    try {
      console.log(
        `TCPServerSocket.serve ${options.port} ${String(options.backlog)}`
      )
      // const socket = newTCPServerSocket(
      //   options.port,
      //   { binaryType: "arraybuffer" },
      //   options.backlog || undefined
      // )
      const socket = Cc["@mozilla.org/network/server-socket;1"].createInstance(
        Ci.nsIServerSocket
      )
      socket.init(options.port, false, options.backlog || -1)

      console.log(`new TCPServerSocket1 ${socket.port}`)

      const self /*:Server*/ = new Server(socket, socket.port, createConnection)
      self.errored = new Promise(resolve => (self.onerrored = resolve))
      self.closed = new Promise(resolve => (self.onclosed = resolve))
      self.connectionObservers = []

      socket.asyncListen(self)

      return self
    } catch (error) {
      console.error("THROW!", error.toString())
      return IOError.throw(error.message)
    }
  }
  onconnect(socket /*:nsISocketTransport*/) {
    console.log("received connection")
    const { connectionObservers } = this
    if (connectionObservers.length > 0) {
      const observer = connectionObservers.pop()
      const client = TCPSocketAdapter.fromTransport(socket)
      const connection = this.createConnection(client)
      observer.next({ done: false, value: connection })
    } else {
      socket.close(Cr.NS_BINDING_ABORTED)
    }
  }
  onclose(status /*:nsresult*/) {
    this.onclosed()
    this.cancelConnectionObservers()
  }
  onerror(status /*:nsresult*/) {
    const error = new Error(status)
    this.failConnecitonObservers(error)
    this.onerrored(error)
  }
  close() {
    return this.socket.close()
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

  static handleEvent(self /*:ClientHandler*/, event) {
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

  static async connect(
    supervisor /*:Supervisor<ClientHandler>*/,
    id /*:string*/,
    options /*:ClientOptions*/
  ) {
    const { host, port, useSecureTransport } = options
    console.log("Client.connect", host, port, useSecureTransport)

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

  static terminate(self /*:ClientHandler*/) {
    self.supervisor.stopped(self.id)
    ClientHandler.delete(self)
  }

  static opened(handler /*:ClientHandler*/) {
    return handler.opened
  }
  static closed(handler /*:ClientHandler*/) {
    return handler.closed
  }
  static errored(handler /*:ClientHandler*/) {
    return handler.errored
  }
  static bufferedAmount({ socket } /*:ClientHandler*/) {
    return socket.bufferedAmount
  }
  static readyState({ socket } /*:ClientHandler*/) {
    return socket.readyState
  }
  static delete(handler /*:ClientHandler*/) {
    delete handler.socket
    delete handler.client
    delete handler.supervisor
    delete handler.id
  }
  static async close(handler /*:ClientHandler*/) {
    const { socket } = handler
    ClientHandler.delete(handler)
    socket.close()
  }
  static async closeImmediately(handler /*:ClientHandler*/) {
    const { socket } = handler
    ClientHandler.delete(handler)
    socket.closeImmediately()
  }
  static suspend({ socket } /*:ClientHandler*/) {
    socket.suspend()
  }
  static resume({ socket } /*:ClientHandler*/) {
    socket.resume()
  }
  static async write(
    handler /*:ClientHandler*/,
    buffer /*:ArrayBuffer*/,
    options /*::?:WriteOptions*/
  ) /*:Promise<void>*/ {
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
  static async read(self /*:ClientHandler*/) /*: Promise<ArrayBuffer>*/ {
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
  static ondata(self /*:ClientHandler*/, data /*:ArrayBuffer*/) {
    const { readRequests, availableChunks } = self
    if (readRequests.length > 0) {
      readRequests.shift().resolve(data)
    } else {
      availableChunks.push(data)
    }
  }
  static ondrain({ socket } /*:ClientHandler*/) /*: Promise<void>*/ {
    return new Promise(resolve => {
      socket.ondrain = () => {
        resolve()
        socket.ondrain = null
      }
    })
  }
  static onerror(self /*:ClientHandler*/, event) {
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
    const refs = new WeakMap()
    const clients = new WeakMap()

    const deref = /*::<a, b>*/ (
      refs /*:WeakMap<a, b>*/,
      handle /*:a*/
    ) /*:b*/ => {
      const ref = refs.get(handle)
      if (!ref) {
        return IOError.throw("Unable to find corresponding socket")
      } else {
        return ref
      }
    }

    const derefServer = handle => deref(refs, handle)
    const derefSocket = handle => deref(clients, handle)

    debug && console.log("!!!!!!!!! getAPI")

    const TCPServerConnection = exportClass(
      context.cloneScope,
      class ServerConnection {
        /*::
        */
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
        send(buffer, byteOffset, byteLength) {
          return context.wrapPromise(
            new Promise(resolve => {
              derefSocket(this).send(buffer, byteOffset, byteLength)
              derefSocket(this).ondrain = resolve
            })
          )
        }
        read() {
          return context.wrapPromise(
            new Promise((resolve, reject) => {
              derefSocket(this).ondata = resolve
            })
          )
        }
        close() {
          return derefSocket(this).close()
        }
        closeImmediately() {
          return derefSocket(this).closeImmediately()
        }
        upgradeToSecure() {
          return derefSocket(this).upgradeToSecure()
        }
      }
    )

    const TCPServerConnections = exportClass(
      context.cloneScope,
      AsAsyncIterator(
        class ServerConnections {
          /*::
        @@asyncIterator: () => self
        server:TCPServerSocket
        */
          constructor() {
            throw TypeError("Illegal constructor")
          }
          next() {
            return new context.cloneScope.Promise((resolve, reject) => {
              const server = derefServer(this.server)
              // server.addConnectionObserver(resolve, reject)
              server.addConnectionObserver(
                ({ done, value }) => {
                  const next = Cu.cloneInto({ done }, context.cloneScope)
                  Reflect.set(Cu.waiveXrays(next), "value", value)
                  resolve(next)
                },
                // wrapUnprivilegedFunction(resolve, context.cloneScope),
                wrapUnprivilegedFunction(reject, context.cloneScope)
              )
            })
          }
          return() {
            new context.cloneScope.Promise((resolve, reject) => {
              const server = derefServer(this.server)
              server.cancelConnectionObservers()
              resolve(Cu.cloneInto({ done: true }, context.cloneScope))
            })
          }
        }
      )
    )

    const TCPServerSocket = exportClass(
      context.cloneScope,
      class TCPServerSocket {
        constructor() {
          throw TypeError("Illegal constructor")
        }
        close() {
          const server = derefServer(this)
          server.terminate()
          sockets.delete(server)
          refs.delete(server)
        }
        connections() {
          const server = derefServer(this)
          const { connections } = server
          if (connections == null) {
            const connections = createConnections()
            connections.server = this

            server.connections = connections
            return connections
          }
          return connections
        }
        get localPort() {
          return derefServer(this).localPort
        }
        get closed() {
          return context.wrapPromise(derefServer(this).closed)
        }
        get errored() {
          return context.wrapPromise(derefServer(this).errored)
        }
      }
    )

    const clientManager /*:Supervisor<ClientHandler>*/ = new Supervisor()
    const sockets = new Set()

    context.callOnClose({
      close() {
        for (const socket of sockets) {
          socket.terminate()
        }

        clientManager.stop(ClientHandler.closeImmediately)
      }
    })

    const createConnection = (
      socket /*:TCPSocketAdapter*/
    ) /*:TCPServerConnection*/ => {
      const connection = exportInstance(context.cloneScope, TCPServerConnection)
      clients.set(connection, socket)
      console.log("TCPServerConnection", connection)

      connection.opened = context.wrapPromise(
        new Promise(resolve => (socket.onopen = resolve))
      )
      connection.closed = context.wrapPromise(
        new Promise(resolve => (socket.onclose = resolve))
      )
      connection.errored = context.wrapPromise(
        new Promise(resolve => (socket.onerror = resolve))
      )

      return connection
    }

    const createConnections = () /*:TCPServerConnections*/ =>
      exportInstance(context.cloneScope, TCPServerConnections)

    const createServer = () /*:ServerSocket*/ =>
      exportInstance(context.cloneScope, TCPServerSocket)

    return {
      TCPServerSocket: {
        listen: options =>
          new context.cloneScope.Promise(async (resolve, reject) => {
            const server = await Server.new(options, createConnection)
            const api = exportInstance(context.cloneScope, TCPServerSocket)
            sockets.add(server)
            refs.set(api, server)

            resolve(api)
          })
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
      console.log(key, descriptor)
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

const SEC_ERROR_BASE = Ci.nsINSSErrorsService.NSS_SEC_ERROR_BASE
const SEC_ERROR_EXPIRED_CERTIFICATE = SEC_ERROR_BASE + 11
const SEC_ERROR_REVOKED_CERTIFICATE = SEC_ERROR_BASE + 12
const SEC_ERROR_UNKNOWN_ISSUER = SEC_ERROR_BASE + 13
const SEC_ERROR_UNTRUSTED_ISSUER = SEC_ERROR_BASE + 20
const SEC_ERROR_UNTRUSTED_CERT = SEC_ERROR_BASE + 21
const SEC_ERROR_EXPIRED_ISSUER_CERTIFICATE = SEC_ERROR_BASE + 30
const SEC_ERROR_CA_CERT_INVALID = SEC_ERROR_BASE + 36
const SEC_ERROR_INADEQUATE_KEY_USAGE = SEC_ERROR_BASE + 90
const SEC_ERROR_CERT_SIGNATURE_ALGORITHM_DISABLED = SEC_ERROR_BASE + 176

const SSL_ERROR_BASE = -0x3000
const SSL_ERROR_NO_CERTIFICATE = 3
const SSL_ERROR_BAD_CERTIFICATE = SSL_ERROR_BASE + 4
const SSL_ERROR_UNSUPPORTED_CERTIFICATE_TYPE = SSL_ERROR_BASE + 8
const SSL_ERROR_UNSUPPORTED_VERSION = SSL_ERROR_BASE + 9
const SSL_ERROR_BAD_CERT_DOMAIN = SSL_ERROR_BASE + 12

const BUFFER_SIZE = 65536

class TCPSocketAdapter {
  /*::
  host:string;
  port:number;
  bufferedAmount:number;
  transport:nsISocketTransport;
  readyState:TCPReadyState;
  ssl:boolean;
  socketInputStream:?nsIInputStream
  socketOutputStream:?nsIOutputStream
  binaryInputStream:nsIBinaryInputStream
  inputStreamPump:?nsIInputStreamPump
  suspendCount:number
  asyncCopierActive:boolean
  waitingForDrain:boolean
  waitingForStartTLS:boolean
  pendingData:nsIInputStream[]
  pendingDataAfterStartTLS:nsIInputStream[]

  onopen:?({type:"open"}) => void
  onclose:?({type:"close"}) => void
  ondrain:?({type:"drain"}) => void
  ondata:?({type:"data", data:ArrayBuffer}) => void
  onerror:?({type:"error", name:string, message:string}) => void
  */
  constructor(host /*:string*/, port /*:number*/, ssl /*:boolean*/) {
    this.host = host
    this.port = port
    this.ssl = ssl
    this.readyState = "closed"
    this.asyncCopierActive = false
    this.waitingForDrain = false
    this.bufferedAmount = 0
    this.suspendCount = 0
    this.waitingForStartTLS = false
    this.pendingData = []
    this.pendingDataAfterStartTLS = []
  }
  static fromTransport(transport /*:nsISocketTransport*/) {
    const self = new TCPSocketAdapter(transport.host, transport.port, false)
    self.transport = transport

    TCPSocketAdapter.createStream(self)
    TCPSocketAdapter.createInputStreamPump(self)
    self.readyState = "open"

    return self
  }
  static connect(
    host /*:string*/,
    port /*:number*/,
    options /*:{useSecureTransport?:boolean}*/
  ) {
    const self = new TCPSocketAdapter(host, port, !!options.useSecureTransport)
    TCPSocketAdapter.init(self)
    return self
  }
  static init(self) {
    self.readyState = "connecting"
    const transportService = Cc[
      "@mozilla.org/network/socket-transport-service;1"
    ].getService(Ci.nsISocketTransportService)
    const socketTypes = self.ssl ? ["ssl"] : ["starttls"]
    const transport = transportService.createTransport(
      socketTypes,
      1,
      self.host,
      self.port,
      null
    )
    TCPSocketAdapter.initWithUnconnectedTransport(self, transport)
  }
  static initWithUnconnectedTransport(self, transport) {
    self.readyState = "connecting"
    self.transport = transport
    transport.setEventSink(self, null)
    TCPSocketAdapter.createStream(self)
  }
  static createStream(self) {
    const { transport } = self
    const socketInputStream = transport.openInputStream(0, 0, 0)
    const socketOutputStream = transport.openOutputStream(
      Ci.nsITransport.OPEN_UNBUFFERED,
      0,
      0
    )
    const asyncStream = socketInputStream.QueryInterface(Ci.nsIAsyncInputStream)

    asyncStream.asyncWait(
      self,
      Ci.nsIAsyncInputStream.WAIT_CLOSURE_ONLY,
      0,
      null
    )
    const binaryInputStream = Cc[
      "@mozilla.org/binaryinputstream;1"
    ].createInstance(Ci.nsIBinaryInputStream)
    binaryInputStream.setInputStream(socketInputStream)

    self.binaryInputStream = binaryInputStream
    self.socketInputStream = socketInputStream
  }
  static createInputStreamPump(self) {
    const { socketInputStream } = self
    if (!socketInputStream) {
      return IOError.throw(Cr.NS_ERROR_NOT_AVAILABLE)
    }
    const inputStreamPump = Cc[
      "@mozilla.org/network/input-stream-pump;1"
    ].createInstance(Ci.nsIInputStreamPump)
    inputStreamPump.init(socketInputStream, 0, 0, false, null)

    while (self.suspendCount--) {
      inputStreamPump.suspend()
    }
    inputStreamPump.asyncRead(self, null)
  }
  static maybeReportErrorAndCloseIfOpen(self, status) {
    if (self.readyState === "closed") {
      return undefined
    }
    self.close()
    self.readyState = "closed"

    if (status !== Cr.NS_OK) {
      let errorType = "SecurityProtocol"
      let errorName = "SecurityError"

      // security module? (and this is an error)
      if ((status & 0xff0000) === 0x5a0000) {
        const errorService = Cc["@mozilla.org/nss_errors_service;1"].getService(
          Ci.nsINSSErrorsService
        )
        try {
          // getErrorClass will throw a generic NS_ERROR_FAILURE if the error code is
          // somehow not in the set of covered errors.
          const errorClass = errorService.getErrorClass(status)
          switch (errorClass) {
            case Ci.nsINSSErrorsService.ERROR_CLASS_BAD_CERT: {
              errorType = "SecurityCertificate"
              break
            }
            default: {
              break
            }
          }
        } catch (_) {}

        // NSS_SEC errors (happen below the base value because of negative vals)
        if (
          (status & 0xffff) <
          Math.abs(Ci.nsINSSErrorsService.NSS_SEC_ERROR_BASE)
        ) {
          switch (status) {
            case SEC_ERROR_EXPIRED_CERTIFICATE:
              errorName = "SecurityExpiredCertificateError"
              break
            case SEC_ERROR_REVOKED_CERTIFICATE:
              errorName = "SecurityRevokedCertificateError"
              break
            case SEC_ERROR_UNKNOWN_ISSUER:
            case SEC_ERROR_UNTRUSTED_ISSUER:
            case SEC_ERROR_UNTRUSTED_CERT:
            case SEC_ERROR_CA_CERT_INVALID:
              errorName = "SecurityUntrustedCertificateIssuerError"
              break
            case SEC_ERROR_INADEQUATE_KEY_USAGE:
              errorName = "SecurityInadequateKeyUsageError"
              break
            case SEC_ERROR_CERT_SIGNATURE_ALGORITHM_DISABLED:
              errorName = "SecurityCertificateSignatureAlgorithmDisabledError"
              break
            default:
              break
          }
        } else {
          switch (status) {
            case SSL_ERROR_NO_CERTIFICATE:
              errorName = "SecurityNoCertificateError"
              break
            case SSL_ERROR_BAD_CERTIFICATE:
              errorName = "SecurityBadCertificateError"
              break
            case SSL_ERROR_UNSUPPORTED_CERTIFICATE_TYPE:
              errorName = "SecurityUnsupportedCertificateTypeError"
              break
            case SSL_ERROR_UNSUPPORTED_VERSION:
              errorName = "SecurityUnsupportedTLSVersionError"
              break
            case SSL_ERROR_BAD_CERT_DOMAIN:
              errorName = "SecurityCertificateDomainMismatchError"
              break
            default:
              break
          }
        }
      } else {
        errorType = "Network"
        switch (status) {
          case Cr.NS_ERROR_CONNECTION_REFUSED: {
            errorName = "ConnectionRefusedError"
            break
          }
          case Cr.NS_ERROR_NET_TIMEOUT: {
            errorName = "NetworkTimeoutError"
            break
          }
          case Cr.NS_ERROR_UNKNOWN_HOST: {
            errorName = "DomainNotFoundError"
            break
          }
          case Cr.NS_ERROR_NET_INTERRUPT: {
            errorName = "NetworkInterruptError"
            break
          }
          default: {
            errorName = "NetworkError"
            break
          }
        }
      }

      TCPSocketAdapter.fireErrorEvent(self, errorName, errorType)
    }
    TCPSocketAdapter.fireEvent(self, "closed")
  }
  static fireErrorEvent(self, name, type) {
    const { onerror } = self
    if (onerror) {
      onerror({ type: "error", name, message: type })
    }
  }
  static fireEvent(self, type) {
    const event = { type }
    switch (type) {
      case "close": {
        const handler = self.onclose
        if (handler) {
          handler({ type: "close" })
        }
        break
      }
      case "open": {
        const handler = self.onopen
        if (handler) {
          handler({ type: "open" })
        }
        break
      }
      case "drain": {
        const handler = self.ondrain
        if (handler) {
          handler({ type: "drain" })
        }
        break
      }
    }
  }
  static fireDataEvent(self, buffer) {
    const { ondata } = self
    if (ondata) {
      ondata({ type: "data", data: buffer })
    }
  }
  static close(self, waitForUnsentData /*:boolean*/) {
    if (self.readyState === "closed" || self.readyState === "closing") {
      return undefined
    }
    self.readyState = "closing"
    if (self.asyncCopierActive || !waitForUnsentData) {
      self.pendingData.splice(0)
      self.pendingDataAfterStartTLS.splice(0)

      const { socketOutputStream, socketInputStream } = self
      if (socketOutputStream) {
        socketOutputStream.close()
        self.socketOutputStream = null
        delete self.binaryInputStream
      }

      if (socketInputStream) {
        socketInputStream.close()
        self.socketInputStream = null
      }
    }
  }
  static send(self, stream, byteLength) {
    self.bufferedAmount += byteLength
    const isBufferFull = self.bufferedAmount > BUFFER_SIZE
    if (isBufferFull) {
      self.waitingForDrain = true
    }

    if (self.waitingForStartTLS) {
      self.pendingDataAfterStartTLS.push(stream)
    } else {
      self.pendingData.push(stream)
    }
    TCPSocketAdapter.ensureCopying(self)

    return !isBufferFull
  }
  static ensureCopying(self) {
    const { socketOutputStream } = self
    if (self.asyncCopierActive || !socketOutputStream) {
      return
    }
    self.asyncCopierActive = true
    const multiplexStream = Cc[
      "@mozilla.org/io/multiplex-input-stream;1"
    ].createInstance(Ci.nsIMultiplexInputStream)

    const stream = multiplexStream.QueryInterface(Ci.nsIInputStream)

    while (self.pendingData.length > 0) {
      const stream = self.pendingData.shift()
      multiplexStream.appendStream(stream)
    }

    const copier = Cc[
      "@mozilla.org/network/async-stream-copier;1"
    ].createInstance(Ci.nsIAsyncStreamCopier)
    const socketTransportService = Cc[
      "@mozilla.org/network/socket-transport-service;1"
    ].getService(Ci.nsISocketTransportService)

    const target = socketTransportService.QueryInterface(Ci.nsIEventTarget)

    copier.init(
      stream,
      socketOutputStream,
      target,
      true,
      false,
      BUFFER_SIZE,
      false,
      false
    )

    copier.asyncCopy(new CopierCallbacks(self), null)
  }
  static notifyCopyComplete(self, status) {
    self.asyncCopierActive = false
    let bufferedAmount = 0
    for (let stream of self.pendingData) {
      bufferedAmount += stream.available()
    }
    self.bufferedAmount = bufferedAmount

    if (status !== Cr.NS_OK) {
      return TCPSocketAdapter.maybeReportErrorAndCloseIfOpen(self, status)
    }

    if (bufferedAmount != null) {
      return TCPSocketAdapter.ensureCopying(self)
    }

    // Maybe we have some empty stream. We want to have an empty queue now.
    self.pendingData.splice(0)
    // If we are waiting for initiating starttls, we can begin to
    // activate tls now.
    if (self.waitingForStartTLS && self.readyState === "open") {
      TCPSocketAdapter.activateTLS(self)
      self.waitingForStartTLS = false
      // If we have pending data, we should send them, or fire
      // a drain event if we are waiting for it.
      if (self.pendingDataAfterStartTLS.length !== 0) {
        self.pendingData = self.pendingDataAfterStartTLS
        return TCPSocketAdapter.ensureCopying(self)
      }
    }

    if (self.waitingForDrain) {
      self.waitingForDrain = false
      TCPSocketAdapter.fireEvent(self, "drain")
    }

    if (self.readyState === "closing") {
      const { socketOutputStream } = self
      if (socketOutputStream) {
        socketOutputStream.close()
        self.socketOutputStream = null
      }
      self.readyState = "closed"
      TCPSocketAdapter.fireEvent(self, "close")
    }
  }
  static activateTLS(self) {
    const { securityInfo } = self.transport
    const socketControl = securityInfo.QueryInterface(Ci.nsISSLSocketControl)
    if (socketControl) {
      socketControl.StartTLS()
    }
  }

  onTransportStatus(transport, status, progress, max) {
    this.readyState = "open"
    TCPSocketAdapter.createInputStreamPump(self)
    TCPSocketAdapter.fireEvent(self, "open")
  }
  onStartRequest(request, context) {}
  onDataAvailable(request, context, stream /*:nsIInputStream*/, offset, size) {
    const buffer = new ArrayBuffer(size)
    let actual = 0
    this.binaryInputStream.readArrayBuffer(size, buffer)
    TCPSocketAdapter.fireDataEvent(this, buffer)
  }
  onStopRequest(request, context, status) {
    this.inputStreamPump = null
    if (this.asyncCopierActive && status === Cr.NS_OK) {
      // If we have some buffered output still, and status is not an
      // error, the other side has done a half-close, but we don't
      // want to be in the close state until we are done sending
      // everything that was buffered. We also don't want to call onclose
      // yet.
      return undefined
    } else {
      return TCPSocketAdapter.maybeReportErrorAndCloseIfOpen(this, status)
    }
  }
  onInputStreamReady(asyncStream /*:nsIAsyncInputStream*/) /*:void*/ {
    // Only used for detecting if the connection was refused.
    try {
      asyncStream.available()
    } catch (error) {
      TCPSocketAdapter.maybeReportErrorAndCloseIfOpen(this, error)
    }
  }

  send(
    buffer /*:ArrayBuffer*/,
    byteOffset /*:number*/ = 0,
    byteLength = buffer.byteLength
  ) {
    if (this.readyState !== "open") {
      return IOError.throw("Socket is not open")
    }
    const stream = Cc[
      "@mozilla.org/io/arraybuffer-input-stream;1"
    ].createInstance(Ci.nsIArrayBufferInputStream)
    stream.setData(buffer, byteOffset, byteLength)
    TCPSocketAdapter.send(this, stream, byteLength)
  }
  close() {
    TCPSocketAdapter.close(this, true)
  }
  closeImmediately() {
    TCPSocketAdapter.close(this, false)
  }
  upgradeToSecure() {
    if (this.readyState !== "open") {
      return IOError.throw(Cr.NS_ERROR_FAILURE)
    }
    if (!this.ssl) {
      return
    }
    if (!this.asyncCopierActive) {
      TCPSocketAdapter.activateTLS(this)
    } else {
      this.waitingForStartTLS = true
    }
  }
}

class CopierCallbacks {
  /*::
  owner:TCPSocketAdapter
  */
  constructor(socket) {
    this.owner = socket
  }
  onStartRequest(request, context) {}
  onStopRequest(request, context, status) {
    TCPSocketAdapter.notifyCopyComplete(this.owner, status)
    delete this.owner
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

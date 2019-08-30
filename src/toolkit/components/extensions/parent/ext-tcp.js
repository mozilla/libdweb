// @flow strict

/*::
import { Components, Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {
  BaseContext,
  nsresult,
  nsISupports,
  nsISocketTransport,
  nsIServerSocket,
  TCPReadyState,
  nsIInputStream,
  nsIOutputStream,
  nsIBinaryOutputStream,
  nsIBinaryInputStream,
  nsIAsyncInputStream,
  nsIInputStreamPump,
  nsIRequestObserver,
  nsIEventTarget,

  TCPServerSocketAPI,
  TCPSocketAPI,
  SocketOptions,
  TCPSocketBinaryType,
  TCPServerSocketEventAPI,
  ErrorEventAPI
} from "gecko"
import type {
  API,
  ServerOptions,
  ServerSocket,

  ClientOptions,
  ClientSocket,

  Status,
} from "../interface/tcp"

interface Host {
  +TCPSocket: API;
}
*/
Cu.importGlobalProperties(["URL"])

{
  const { OS } = Cu.import("resource://gre/modules/osfile.jsm", {})
  const { TCPSocket, TCPServerSocket } = Cu.getGlobalForObject(OS)
  const { ExtensionUtils } = Cu.import(
    "resource://gre/modules/ExtensionUtils.jsm",
    {}
  )
  const env = Cc["@mozilla.org/process/environment;1"].getService(
    Ci.nsIEnvironment
  )

  const { ExtensionError } = ExtensionUtils

  class IOError extends ExtensionError {
    static throw(message) /*:empty*/ {
      const self = new this(message)
      throw self
    }
  }

  class Server {
    /*::
    socket:TCPServerSocketAPI
    closed:Promise<void>
    onerrored:(Error) => void
    onclosed:() => void
    context:BaseContext
    connections:Connections
    localPort:number
    */
    constructor(
      socket /*:TCPServerSocketAPI*/,
      localPort /*:number*/,
      connections /*:Connections*/
    ) {
      this.socket = socket
      this.localPort = localPort
      this.connections = connections
    }

    closeImmediately() {
      debug && console.log("terminate server")
      this.close()
      this.delete()
    }
    delete() {
      delete this.socket
      delete this.closed
    }
    static async new(options /*:ServerOptions*/) /*: Promise<Server>*/ {
      try {
        debug &&
          console.log(
            `TCPServerSocket.serve ${options.port} ${String(options.backlog)}`
          )
        const socket = new TCPServerSocketAdapter(
          options.port,
          { binaryType: "arraybuffer" },
          options.backlog || undefined
        )

        debug && console.log(`new TCPServerSocket ${socket.localPort}`)
        const connections = new Connections()
        const server = new Server(socket, socket.localPort, connections)

        socket.onconnect = event => connections.connect(event.socket)
        server.closed = new Promise((resolve, reject) => {
          server.onclosed = () => resolve()
          socket.onerror = ({ name, message }) =>
            reject(new Error(`${name}: ${message}`))
        })

        return server
      } catch (error) {
        return IOError.throw(error.message)
      }
    }
    onclose(status /*:nsresult*/) {
      this.onclosed()
      this.connections.close()
    }
    onerror(status /*:nsresult*/) {
      const error = new Error(status)
      this.connections.close(error)
      this.onerrored(error)
    }
    close() {
      this.socket.close()
      this.onclose(Cr.NS_OK)
    }
  }

  class Connections {
    /*::
    requests:{resolve(?TCPSocketAPI):void, reject(Error):void}[]
    */
    constructor() {
      this.requests = []
    }
    request(resolve, reject) {
      this.requests.push({ resolve, reject })
    }
    connect(socket /*:TCPSocketAPI*/) {
      const request = this.requests.shift()
      if (request) {
        request.resolve(socket)
      } else {
        socket.closeImmediately()
      }
    }
    close(error) {
      const { requests } = this
      while (requests.length) {
        const request = requests.shift()
        if (error) {
          request.reject(error)
        } else {
          request.resolve()
        }
      }
    }
  }

  global.TCPSocket = class extends ExtensionAPI /*::<Host>*/ {
    getAPI(context) {
      const servers = new Map()
      const clients = new Map()

      context.callOnClose({
        close() {
          debug && console.log(`TCPSocket API unload ${clients.size}`)
          for (const server of servers.values()) {
            server.close()
          }
          for (const socket of clients.values()) {
            socket.closeImmediately()
          }
        }
      })

      let serverIdx = 0
      let connectionIdx = 0

      let eventQueue = []
      let pendingPoll = null

      const emit = event => {
        if (pendingPoll) {
          pendingPoll(event)
        } else {
          eventQueue.push(event)
        }
      }

      const serialiseSocket = (socket, id) => {
        return {
          id,
          host: socket.host,
          port: socket.port,
          ssl: socket.ssl,
          readyState: socket.readyState,
          bufferedAmount: socket.bufferedAmount
        }
      }

      return {
        TCPSocket: {
          listen: options =>
            new context.cloneScope.Promise(async (resolve, reject) => {
              try {
                const id = ++serverIdx
                const server = await Server.new(options)

                servers.set(id, server)
                server.closed.then(() => {
                  emit(["serverClose", id])
                  servers.delete(id)
                })
                resolve({
                  id,
                  localPort: server.localPort
                })
              } catch (error) {
                reject(error.message)
              }
            }),
          connect: options =>
            new Promise(async (resolve, reject) => {
              try {
                const socket = new TCPSocket(options.host, options.port, {
                  useSecureTransport: options.useSecureTransport,
                  binaryType: "arraybuffer"
                })

                const client = serialiseSocket(socket, ++connectionIdx)
                clients.set(client.id, socket)

                socket.onopen = () => {
                  emit(["open", serialiseSocket(socket, client.id)])
                }
                socket.onclose = () => {
                  emit(["close", serialiseSocket(socket, client.id)])
                  clients.delete(client.id)
                }
                socket.ondata = event => {
                  emit(["data", serialiseSocket(socket, client.id), event.data])
                }
                resolve(client)
              } catch (error) {
                reject(error.message)
              }
            }),
          pollEventQueue: () => {
            return new context.cloneScope.Promise(resolve => {
              if (eventQueue.length > 0) {
                resolve(eventQueue)
                eventQueue = []
              } else {
                pendingPoll = event => {
                  resolve([event])
                  eventQueue = []
                  pendingPoll = null
                }
              }
            })
          },
          write: (socketId, buffer, byteOffset, byteLength) => {
            return new context.cloneScope.Promise((resolve, reject) => {
              const socket = clients.get(socketId)
              if (socket.send(buffer, byteOffset, byteLength)) {
                resolve()
              } else {
                socket.ondrain = resolve
                socket.onerror = ({ name, message }) =>
                  reject(new IOError(`${name}: ${message}`))
              }
            })
          },
          suspend: socketId => {
            const socket = clients.get(socketId)
            socket.suspend()
          },
          resume: socketId => {
            const socket = clients.get(socketId)
            socket.resume()
          },
          close: socketId => {
            return new context.cloneScope.Promise(resolve => {
              const socket = clients.get(socketId)
              socket.close()
              resolve()
            })
          },
          closeImmediately: socketId => {
            const socket = clients.get(socketId)
            socket.closeImmediately()
          },
          upgradeToSecure: socketId => {
            const socket = clients.get(socketId)
            socket.upgradeToSecure()
          },
          closeServer: serverId => {
            const server = servers.get(serverId)
            server.close()
            servers.delete(serverId)
          },
          pollServer: serverId => {
            const server = servers.get(serverId)
            return new context.cloneScope.Promise((resolve, reject) => {
              server.connections.request(socket => {
                if (socket) {
                  const client = serialiseSocket(socket, ++connectionIdx)
                  clients.set(client.id, socket)

                  socket.onopen = () => {
                    emit(["open", serialiseSocket(socket, client.id)])
                  }
                  socket.onclose = () => {
                    emit(["close", serialiseSocket(socket, client.id)])
                  }
                  socket.ondata = event => {
                    emit([
                      "data",
                      serialiseSocket(socket, client.id),
                      event.data
                    ])
                  }
                  resolve(client)
                } else {
                  resolve()
                }
              }, reject)
            })
          }
        }
      }
    }
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

  // Port of: https://github.com/mozilla/gecko-dev/blob/f51c4fa5d92d59fcb46f314e94edbf045cb3067c/dom/network/TCPServerSocket.cpp
  class TCPServerSocketAdapter /*::implements TCPServerSocketAPI*/ {
    /*::
  onconnect: ?(TCPServerSocketEventAPI) => mixed;
  onerror: ?(ErrorEventAPI) => mixed;
  localPort: number;
  serverSocket: ?nsIServerSocket;
  */
    constructor(port, options, backlog) {
      const serverSocket = Cc[
        "@mozilla.org/network/server-socket;1"
      ].createInstance(Ci.nsIServerSocket)
      serverSocket.init(port, false, backlog || -1)
      this.serverSocket = serverSocket
      this.localPort = serverSocket.port

      serverSocket.asyncListen(this)
    }
    close() {
      debug && console.log("TPCServerSocketAdapter.close", this.serverSocket)
      if (this.serverSocket) {
        this.serverSocket.close()
      }
    }

    // nsIServerSocketListener
    onSocketAccepted(server, transport) {
      const socket = TCPSocketAdapter.createAcceptedSocket(transport)
      TCPServerSocketAdapter.fireEvent(this, "connect", socket)
    }
    onStopListening(server, status) {
      this.serverSocket = null
      switch (status) {
        case Cr.NS_BINDING_ABORTED: {
          break
        }
        default: {
          TCPServerSocketAdapter.fireErrorEvent(
            this,
            "NetworkError",
            "Server socket was closed by unexpected reason."
          )
        }
      }
    }

    // Statics
    static fireEvent(self, type, socket /*:TCPSocketAPI*/) {
      switch (type) {
        case "connect": {
          if (self.onconnect) {
            self.onconnect({
              type: "connect",
              socket
            })
          }
          break
        }
      }
    }
    static fireErrorEvent(self, name, message) {
      if (self.onerror) {
        self.onerror({
          type: "error",
          name,
          message
        })
      }
    }
  }

  // Port of: https://github.com/mozilla/gecko-dev/blob/f51c4fa5d92d59fcb46f314e94edbf045cb3067c/dom/network/TCPSocket.cpp#L411
  const DO_NOT_INIT = {}
  const ASYNC_COPY = { type: "asyncCopy" }
  const ASYNC_READ = { type: "asyncRead" }

  class TCPSocketAdapter /*::implements TCPSocketAPI*/ {
    /*::
    host:string;
    port:number;
    binaryType: TCPSocketBinaryType;
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
    copyObserver:nsIRequestObserver

    onopen:?({type:"open"}) => mixed
    onclose:?({type:"close"}) => mixed
    ondrain:?({type:"drain"}) => mixed
    ondata:?({type:"data", data:ArrayBuffer}) => mixed
    onerror:?(ErrorEventAPI) => mixed
    */
    constructor(
      host /*:string*/,
      port /*:number*/,
      options /*::?:SocketOptions*/
    ) {
      this.host = host
      this.port = port
      this.ssl = options && options.useSecureTransport ? true : false
      this.readyState = "closed"
      this.asyncCopierActive = false
      this.waitingForDrain = false
      this.bufferedAmount = 0
      this.suspendCount = 0
      this.waitingForStartTLS = false
      this.pendingData = []
      this.pendingDataAfterStartTLS = []
      this.binaryType = "arraybuffer"
      this.copyObserver = new CopierObserver(this)

      if (options !== DO_NOT_INIT) {
        TCPSocketAdapter.init(this)
      }
    }
    static createAcceptedSocket(transport /*:nsISocketTransport*/) {
      const self = new TCPSocketAdapter(
        transport.host,
        transport.port,
        DO_NOT_INIT
      )
      self.transport = transport

      TCPSocketAdapter.createStream(self)
      TCPSocketAdapter.createInputStreamPump(self)
      self.readyState = "open"

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
      const asyncStream = socketInputStream.QueryInterface(
        Ci.nsIAsyncInputStream
      )

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
      self.socketOutputStream = socketOutputStream
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
          const errorService = Cc[
            "@mozilla.org/nss_errors_service;1"
          ].getService(Ci.nsINSSErrorsService)
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
      TCPSocketAdapter.fireEvent(self, "close")
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
      debug && console.log(`TCPSocketAdapter.send ${stream.available()}`)
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
      const { socketOutputStream, asyncCopierActive } = self

      if (asyncCopierActive || !socketOutputStream) {
        return
      }
      self.asyncCopierActive = true
      const multiplexStream = Cc[
        "@mozilla.org/io/multiplex-input-stream;1"
      ].createInstance(Ci.nsIMultiplexInputStream)

      const multiplex$inputStream /*:nsISupports<nsIInputStream>*/ = multiplexStream
      const stream = multiplex$inputStream.QueryInterface(Ci.nsIInputStream)

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

      const $target /*:nsISupports<nsIEventTarget>*/ = socketTransportService
      const target = $target.QueryInterface(Ci.nsIEventTarget)

      debug &&
        console.log(
          `TCPSocketAdapter.ensureCopying copy ${stream.available()} bytes`
        )

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

      copier.asyncCopy(self.copyObserver, null)
    }
    static notifyCopyComplete(self, status) {
      debug && console.log(`TCPSocketAdapter.notifyCopyComplete ${status}`)
      self.asyncCopierActive = false
      let bufferedAmount = 0
      for (const stream of self.pendingData) {
        bufferedAmount += stream.available()
      }
      self.bufferedAmount = bufferedAmount

      if (status !== Cr.NS_OK) {
        return TCPSocketAdapter.maybeReportErrorAndCloseIfOpen(self, status)
      }

      if (bufferedAmount > 0) {
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
        delete self.copyObserver
        TCPSocketAdapter.fireEvent(self, "close")
      }
    }
    static activateTLS(self) {
      const { securityInfo } = self.transport
      const socketControl = securityInfo.QueryInterface(Ci.nsISSLSocketControl)
      if (socketControl) {
        socketControl.StartTLS()
        self.ssl = true
      }
    }

    onTransportStatus(transport, status, progress, max) {
      this.readyState = "open"
      TCPSocketAdapter.createInputStreamPump(self)
      TCPSocketAdapter.fireEvent(self, "open")
    }
    onStartRequest(request, context) {}
    onDataAvailable(request, stream /*:nsIInputStream*/, offset, size) {
      const buffer = new ArrayBuffer(size)
      this.binaryInputStream.readArrayBuffer(size, buffer)
      TCPSocketAdapter.fireDataEvent(this, buffer)
    }
    onStopRequest(request, status) {
      debug && console.log(`TCPSocketAdapter.notifyReadComplete ${status}`)
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
        const available = asyncStream.available()
        debug &&
          console.log(
            `TCPSocketAdapter.onInputStreamReady available: ${available}`
          )
      } catch (error) {
        debug &&
          console.log(
            `TCPSocketAdapter.onInputStreamReady unavailable: ${error}`
          )
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
      return TCPSocketAdapter.send(this, stream, byteLength)
    }
    suspend() {}
    resume() {}
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

  class CopierObserver {
    /*::
    owner:TCPSocketAdapter
    */
    constructor(socket) {
      this.owner = socket
    }
    onStartRequest(request) {}
    onStopRequest(request, status) {
      TCPSocketAdapter.notifyCopyComplete(this.owner, status)
    }
  }

  const debug = env.get("MOZ_ENV") === "DEBUG"
}

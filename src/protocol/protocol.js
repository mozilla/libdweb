const EXPORTED_SYMBOLS = []
const debug = true
const {
  classes: Cc,
  interfaces: Ci,
  utils: Cu,
  results: Cr,
  manager: Cm
} = Components
const { ppmm, cpmm, mm, appinfo } = Cu.import(
  "resource://gre/modules/Services.jsm",
  {}
).Services
const { getConsole } = Cu.import(
  "resource://gre/modules/ExtensionUtils.jsm",
  {}
).ExtensionUtils
const { XPCOMUtils } = Cu.import("resource://gre/modules/XPCOMUtils.jsm", {})
const { setTimeout } = Cu.import("resource://gre/modules/Timer.jsm", {})
const PR_UINT32_MAX = 0xffffffff

const { generateUUID } = Cc["@mozilla.org/uuid-generator;1"].getService(
  Ci.nsIUUIDGenerator
)

XPCOMUtils.defineLazyGetter(this, "console", getConsole)
const contentSecManager = Cc[
  "@mozilla.org/contentsecuritymanager;1"
].getService(Ci.nsIContentSecurityManager)

const isParent = appinfo.processType === appinfo.PROCESS_TYPE_DEFAULT
const { ID } = Components

const componentRegistrar = Cm.QueryInterface(Ci.nsIComponentRegistrar)
const pid = `@${appinfo.processType}#${appinfo.processID}`

const getFactoryByCID = cid =>
  componentRegistrar.getClassObject(cid, Ci.nsIFactory)

const getCIDByContractID = contractID =>
  componentRegistrar.contractIDToCID(contractID)

const getContractIDByScheme = scheme =>
  `@mozilla.org/network/protocol;1?name=${scheme}`

const getCIDByScheme = scheme =>
  getCIDByContractID(getContractIDByScheme(scheme)) || null

const getFactoryByProtocolScheme = scheme => {
  const cid = getCIDByScheme(scheme)
  return cid == null ? null : getFactoryByCID(cid)
}

const unregisterProtocol = scheme => {
  const cid = getCIDByScheme(scheme)
  const factory = cid && getFactoryByCID(cid)
  if (cid && factory) {
    componentRegistrar.unregisterFactory(cid, factory)
  }
}

const isContractIDRegistered = contractID =>
  componentRegistrar.isContractIDRegistered(contractID)

const isRegisteredProtocol = scheme =>
  isContractIDRegistered(getContractIDByScheme(scheme))

const registerProtocol = ({ scheme, uuid }, agent) => {
  const contractID = getContractIDByScheme(scheme)
  if (isContractIDRegistered(contractID)) {
    unregisterProtocol(scheme)
  }

  const cid = new ID(uuid)
  const description = `${scheme} protocol handler`
  const factory = new Factory(new ProtocolHandler(scheme, agent))
  componentRegistrar.registerFactory(cid, description, contractID, factory)
  debug &&
    console.log(
      `registerFactory${pid}`,
      cid.toString(),
      contractID,
      factory.instance.scheme,
      Cm.isContractIDRegistered(contractID)
    )
}

class Request {
  constructor(uri, loadInfo) {
    this.uri = uri
    this.loadInfo = loadInfo
  }
  get url() {
    return this.uri.spec
  }
}

const Channel$QueryInterface = XPCOMUtils.generateQI([
  Ci.nsIChannel,
  Ci.nsIRequest
])
const LOAD_NORMAL = 0

const IDLE = 0
const ACTIVE = 1
const PAUSED = 2
const CANCELED = 3
const CLOSED = 4
const FAILED = 5

const abort = {}

const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

class Channel {
  constructor(uri, loadInfo, requestID) {
    this.URI = uri
    this.originalURI = uri
    this.loadInfo = loadInfo
    this.originalURI = null
    this.contentCharset = null
    this.contentLength = null
    this.contentType = null
    this.byteOffset = 0
    this.requestID = requestID

    this.owner = null // Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal)
    this.securityInfo = null
    this.notificationCallbacks = null
    this.loadFlags = LOAD_NORMAL
    this.loadGroup = null
    this.name = uri.spec
    this.status = Cr.NS_ERROR_NOT_INITIALIZED
    this.readyState = IDLE
    this.QueryInterface = Channel$QueryInterface
  }
  toJSON() {
    return {
      uri: this.URI.spec,
      readyState: this.readyState,
      status: this.status,
      contentType: this.contentType,
      byteOffset: this.byteOffset,
      contentLength: this.contentLength
    }
  }
  open2() {
    // throws an error if security checks fail
    contentSecManager.performSecurityCheck(this, null)
    return this.open()
  }
  open() {
    throw Cr.NS_BASE_STREAM_WOULD_BLOCK
  }
  asyncOpen2(listener) {
    // throws an error if security checks fail
    var outListener = contentSecManager.performSecurityCheck(this, listener)
    return this.asyncOpen(outListener, null)
  }
  asyncOpen(listener, context) {
    debug && console.log(`asyncOpen${pid} ${JSON.stringify(this)}`)
    switch (this.readyState) {
      case IDLE: {
        this.listener = listener
        this.context = context
        const { requestID, URI } = this
        const { spec: url, scheme } = URI
        return this.handler.send({ requestID, url, scheme })
      }
      default: {
        throw this.status
      }
    }
  }

  isPending() {
    switch (this.readyState) {
      case ACTIVE:
      case PAUSED: {
        return true
      }
      default: {
        return false
      }
    }
  }

  cancel(status = Cr.NS_BINDING_ABORTED) {
    debug && console.log(`cancel(${status})${pid} ${JSON.stringify(this)}`)
    switch (this.readyState) {
      case ACTIVE:
      case PAUSED: {
        this.setStatus(status)
        return this.handler.updateRequest(this, this.status)
      }
      default: {
        throw this.status
      }
    }
  }
  suspend() {
    debug && console.log(`suspend${pid} ${JSON.stringify(this)}`)
    switch (this.readyState) {
      case ACTIVE: {
        this.readyState = PAUSED
        return this.handler.updateRequest(this, Cr.NS_BASE_STREAM_WOULD_BLOCK)
      }
      case PAUSED: {
        return void this
      }
      default: {
        throw this.status
      }
    }
    this.paused = true
  }
  resume() {
    debug && console.log(`resume${pid} ${JSON.stringify(this)}`)
    switch (this.readyState) {
      case ACTIVE: {
        return void this
      }
      case PAUSED: {
        this.readyState = ACTIVE
        return this.handler.updateRequest(this, Cr.NS_OK)
      }
      default: {
        throw this.status
      }
    }
  }

  setStatus(status) {
    switch (status) {
      case Cr.NS_OK:
      case Cr.NS_BINDING_ABORTED: {
        this.readyState = CANCELED
        this.status = Cr.NS_BINDING_ABORTED
        return this
      }
      default: {
        this.readyState = FAILED
        this.status = status
        return this
      }
    }
  }

  onResponse(response) {
    const {
      contentType,
      contentLength,
      contentCharset,
      content,
      close
    } = response
    if (contentType) {
      this.contentType = contentType
    }
    if (contentLength) {
      this.contentLength = contentLength
    }
    if (contentCharset) {
      this.contentCharset = contentCharset
    }

    if (this.readyState === IDLE) {
      this.onOpen()
    }

    if (content != null && this.isPending()) {
      this.onData(content)
    }

    if (done) {
      this.onClose()
    }
  }
  onOpen() {
    this.status = Cr.NS_OK
    this.readyState = ACTIVE
    this.byteOffset = 0
    this.listener.onStartRequest(this, this.context)
  }
  onData(content) {
    const stream = Cc[
      "@mozilla.org/io/arraybuffer-input-stream;1"
    ].createInstance(Ci.nsIArrayBufferInputStream)
    const { byteLength } = content
    stream.setData(content, 0, byteLength)

    debug &&
      console.log(
        `await${pid} ${JSON.stringify(
          this
        )} ${stream.available()} ${byteLength} ${content} `
      )

    this.byteOffset += byteLength
  }
  onClose() {
    debug && console.log(`close${pid} ${JSON.stringify(this)}`)
    const { listener, context, status } = this
    this.listener = null
    this.context = null
    this.handler = null
    this.readyState = CLOSED
    try {
      listener.onStopRequest(this, context, status)
    } catch (_) {
      debug && console.error(`Failed onStopRequest${pid} ${_}`)
    }
  }
}

class ProtocolHandler {
  //   scheme:string
  constructor(scheme, handler) {
    this.scheme = scheme
    this.defaultPort = -1
    this.handler = handler
    this.protocolFlags =
      Ci.nsIProtocolHandler.URI_LOADABLE_BY_SUBSUMERS |
      Ci.nsIProtocolHandler.URI_STD
  }
  toJSON() {
    return {
      scheme: this.scheme,
      defaultPort: this.defaultPort,
      protocolFlags: this.protocolFlags
    }
  }
  // handler(request) {
  //   return {
  //     // contentType: "text/plain",
  //     content: (async function*() {
  //       const encoder = new TextEncoder()
  //       yield encoder.encode(`Hello from <strong>${request.url}</strong>`)
  //       await wait(200)
  //       yield encoder.encode("<br/>")
  //       await wait(200)
  //       yield encoder.encode("\nbye!\n")
  //     })()
  //   }
  // }
  allowPort(port, scheme) {
    return false
  }
  newURI(spec, charset, baseURI) {
    debug && console.log(`newURI${pid} ${spec} ${baseURI && baseURI.spec}`)
    try {
      const url = Cc["@mozilla.org/network/standard-url-mutator;1"]
        .createInstance(Ci.nsIStandardURLMutator)
        .init(
          Ci.nsIStandardURL.URLTYPE_AUTHORITY,
          this.defaultPort,
          spec,
          charset,
          baseURI
        )
        .finalize()
        .QueryInterface(Ci.nsIURI)

      return url
    } catch (_) {
      debug && console.error(`Failed newURI ${pid} ${_}`)
      return null
    }
  }
  newChannel(uri) {
    debug &&
      console.log(`newChannel(${uri.spec})${pid} ${JSON.stringify(this)}`)
    return this.newChannel2(uri, null)
  }
  newChannel2(uri, loadInfo) {
    debug &&
      console.log(`newChannel2(${uri.spec})${pid} ${JSON.stringify(this)}`)
    // const pipe = Cc["@mozilla.org/pipe;1"].createInstance(Ci.nsIPipe)
    // pipe.init(true, true, 0, PR_UINT32_MAX, null)
    // const response = this.handler(request)

    // const channel = Cc[
    //   "@mozilla.org/network/input-stream-channel;1"
    // ].createInstance(Ci.nsIInputStreamChannel)
    // channel.setURI(uri)
    // channel.contentStream = pipe.inputStream
    // channel.QueryInterface(Ci.nsIChannel)
    // channel.contentType = response.contentType

    // const copier = new AsyncIteratorToAsyncOutputStreamCopier(
    //   response.content,
    //   pipe.outputStream
    // )
    // copier.copy()
    return this.handler.request(uri, loadInfo)
  }
  QueryInterface(iid) {
    if (iid.equals(Ci.nsIProtocolHandler) || iid.equals(Ci.nsISupports)) {
      return this
    }
    throw Cr.NS_ERROR_NO_INTERFACE
  }
}

class Factory {
  /*::
  instance: nsQIResult
  */
  constructor(instance /*: nsQIResult */) {
    this.instance = instance
  }
  createInstance(
    outer /*: null | nsISupports<*> */,
    iid /*: nsIIDRef */
  ) /*: nsQIResult */ {
    if (outer != null) {
      throw Cr.NS_ERROR_NO_AGGREGATION
    }

    return this.instance
  }
  lockFactory(lock /*: boolean */) /*: void */ {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED
  }
  QueryInterface(iid /*: nsIIDRef */) /*: Factory<nsQIResult> */ {
    if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIFactory)) {
      return this
    }
    console.log(`!!! Factory.QueryInterface ${iid.name} ${iid.number}\n`)
    throw Cr.NS_ERROR_NO_INTERFACE
  }
}

const PROTOCOLS = `libdweb:protocol:protocols`
const REGISTER = `libdweb:protocol:register`
const INSTALL = `libdweb:protocol:install`
const REQUEST = `libdweb:protocol:request`
const REQUEST_UPDATE = `libdweb:protocol:request:update`
const RESPONSE = `libdweb:protocol:response`

class Supervisor {
  constructor() {
    this.protocols = Object.create(null)
    this.handlers = Object.create(null)
    this.requests = Object.create(null)

    this.pid = `Supervisor${pid}`
  }
  receiveMessage({ data, name, target }) {
    debug &&
      console.log(
        `Receive message:${name} at ${this.pid} ${JSON.stringify(data)}`,
        target
      )

    switch (name) {
      case INSTALL:
        return this.register(data.scheme, target)
      case RESPONSE:
        return this.response(data)
      case REQUEST:
      case REQUEST_UPDATE:
        return this.request(data, target)
    }
  }
  respond(response) {
    debug && console.log(`-> response${this.pid} ${JSON.stringify(response)}`)
    const { requests } = this
    const { requestID } = response
    const request = requests[requestID]
    if (request) {
      if (response.done) {
        delete requestID[requestID]
      }

      request.sendAsyncMessage(RESPONSE, response)
    }
  }
  request(request, target) {
    const { handlers, requests, pid } = this
    const handler = handlers[scheme]
    if (handler) {
      debug &&
        console.log(`-> request${this.pid} ${JSON.stringify(request)}`, target)
      requests[request.requestID] = target
      cpmm.sendAsyncMessage(REQUEST, request)
    }
  }
  register(scheme, handler) {
    const { protocols, handlers } = this
    if (handlers[scheme]) {
      handlers[scheme] = handler
    } else {
      const uuid = generateUUID().toString()
      const protocol = { scheme, uuid }
      protocols[scheme] = protocol
      handlers[scheme] = handler
      registerProtocol(protocol, this)
      ppmm.broadcastAsyncMessage(REGISTER, protocol)
    }
  }
  static spawn() {
    const self = new this()
    debug && console.log(`Spawn ${self.pid}`)
    ppmm.initialProcessData[PROTOCOLS] = self.protocols

    debug &&
      console.log(`initialProcessData`, ppmm.initialProcessData[PROTOCOLS])

    ppmm.loadProcessScript(`data:,Cu.import('${__URI__}');`, true)
    mm.addMessageListener(INSTALL, self)
    mm.addMessageListener(RESPONSE, self)
    mm.addMessageListener(REQUEST, self)
  }
}

class Agent {
  constructor() {
    this.pid = `Agent${pid}`
    this.requests = Object.create(null)
    this.requestID = 0
  }
  static spawn() {
    const self = new Agent()
    debug && console.log(`Spawn ${self.pid}`)
    cpmm.addMessageListener(REGISTER, self)
    cpmm.addMessageListener(RESPONSE, self)

    const protocols = cpmm.initialProcessData[PROTOCOLS]
    console.log(`Initial protocols ${JSON.stringify(protocols)}`)

    if (protocols) {
      for (const protocol of Object.values(protocols)) {
        self.register(protocol)
      }
    }
  }
  register(protocol) {
    registerProtocol(protocol, this)
  }
  request(url /*:nsIURL*/, loadInfo /*:nsILoadInfo*/) /*:Channel*/ {
    const { scheme } = url
    const requestID = `${scheme}:${++this.requestID}${this.pid}`
    const request = new Channel(url, loadInfo, requestID, this)
    this.requests[requestID] = request
    return request
  }
  updateRequest(requestID, status) {
    cpmm.sendAsyncMessage(REQUEST_UPDATE, { requestID, status })
  }
  response(response) {
    const { requestID } = response
    const request = this.requests[requestID]
    if (request) {
      request.onResponse(response)
    } else {
      console.error(`Request corresponding to ${requestID} not found`)
    }
  }
  receiveMessage({ data, name }) {
    debug &&
      console.log(
        `Receive message:${name} at ${this.pid} ${JSON.stringify(data)}`
      )

    switch (name) {
      case REGISTER: {
        return this.register(data)
      }
      case RESPONSE: {
        return this.response(data)
      }
    }
  }
}

if (isParent) {
  Supervisor.spawn()
} else {
  Agent.spawn()
}

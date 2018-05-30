// @flow

/*::
import { Components } from "gecko"
import type {
  nsresult,
  nsWebProgressState,
  nsIIDRef,
  nsIFactory,
  nsIStreamListener,
  nsIInterfaceRequestor,
  nsILoadGroup,
  nsLoadFlags,
  nsILoadInfo,
  nsIURL,
  nsIURI,
  nsIProtocolHandler,
  nsIRequest,
  nsIChannel,
  nsISupports,
  nsITransportSecurityInfo,
  nsIChannelEventSink,
  nsIMessageListener,
  nsIMessageSender,
  nsIMessageBroadcaster,
  nsIMessageListenerManager,
  nsIProgressEventSink
} from "gecko"
*/
const EXPORTED_SYMBOLS = ["Supervisor", "Agent"]
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

const getFactoryByCID = cid => Cm.getClassObject(cid, Ci.nsIFactory)

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

const registerProtocol = ({ scheme, uuid }, handler) => {
  const contractID = getContractIDByScheme(scheme)
  if (isContractIDRegistered(contractID)) {
    unregisterProtocol(scheme)
  }

  const cid = new ID(uuid)
  const description = `${scheme} protocol handler`
  const factory = new Factory(new ProtocolHandler(scheme, handler))
  componentRegistrar.registerFactory(cid, description, contractID, factory)
  debug &&
    console.log(
      `registerFactory${pid}`,
      cid.toString(),
      contractID,
      factory.instance.scheme,
      isContractIDRegistered(contractID)
    )
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

const createDict = /*::<a>*/ () /*: { [string]: a } */ => {
  const dict /*: Object */ = Object.create(null)
  return dict
}

/*::
type ReadyState =
  | typeof IDLE
  | typeof ACTIVE
  | typeof PAUSED
  | typeof CANCELED
  | typeof CLOSED
  | typeof FAILED

export type RequestStatus =
  | typeof Cr.NS_OK
  | typeof Cr.NS_BASE_STREAM_WOULD_BLOCK
  | typeof Cr.NS_BINDING_ABORTED
*/

class TransportSecurityInfo /*::implements nsITransportSecurityInfo*/ {
  /*::
  securityState:nsWebProgressState
  shortSecurityDescription:string
  errorCode:nsresult
  errorMessage:string
  QueryInterface:*
  SSLStatus:*
  state:string
  */
  constructor() {
    this.state = "secure"
    this.securityState = Ci.nsIWebProgressListener.STATE_IS_SECURE
    this.errorCode = Cr.NS_OK
    this.shortSecurityDescription = "Content Addressed"
    this.QueryInterface = XPCOMUtils.generateQI([
      Ci.nsITransportSecurityInfo,
      Ci.nsISSLStatusProvider
    ])
    this.SSLStatus = {
      cipherSuite: "TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256",
      // TLS_VERSION_1_2
      protocolVersion: 3,
      isDomainMismatch: false,
      isNotValidAtThisTime: true,
      serverCert: {
        subjectName: "Content Addressing",
        displayName: "Content Addressing",
        certType: Ci.nsIX509Cert.CA_CERT,
        isSelfSigned: true,
        validity: {}
      }
    }
  }
}

const MAX_UNKNOWN = 0xffffffffffffffff

class Channel /*::implements nsIChannel, nsIRequest*/ {
  /*::
  URI: nsIURI
  scheme: string
  url: string
  originalURI: nsIURI
  loadInfo: null | nsILoadInfo
  contentCharset: ?string
  contentLength: number
  contentType: ?string
  byteOffset: number
  requestID: string
  owner: nsISupports<*> | null
  securityInfo: nsITransportSecurityInfo | null
  loadFlags: nsLoadFlags
  loadGroup: nsILoadGroup
  name: string
  status: nsresult
  readyState: ReadyState
  QueryInterface: typeof Channel$QueryInterface
  contentDisposition: number
  contentDispositionFilename: string
  contentDispositionHeader: string
  notificationCallbacks: nsIInterfaceRequestor<nsIProgressEventSink> | null;

  listener: ?nsIStreamListener
  context: ?nsISupports<*>
  handler: RequestHandler
  */
  constructor(
    uri /*: nsIURI */,
    loadInfo /*: null | nsILoadInfo */,
    requestID /*: string */,
    handler /*: RequestHandler */
  ) {
    this.URI = uri
    this.url = uri.spec
    this.scheme = uri.scheme
    this.originalURI = uri
    this.loadInfo = loadInfo
    this.originalURI = uri
    this.contentCharset = "utf-8"
    this.contentLength = -1
    this.contentType = null
    this.contentDispositionFilename = ""
    this.contentDispositionHeader = ""
    this.byteOffset = 0
    this.requestID = requestID

    this.owner = Cc["@mozilla.org/systemprincipal;1"].createInstance(
      Ci.nsIPrincipal
    )
    this.securityInfo = new TransportSecurityInfo()
    this.notificationCallbacks = null
    this.loadFlags = Ci.nsIRequest.LOAD_NORMAL
    this.name = uri.spec
    this.status = Cr.NS_ERROR_NOT_INITIALIZED
    this.readyState = IDLE
    this.QueryInterface = Channel$QueryInterface
    this.handler = handler
  }
  toJSON() {
    return {
      scheme: this.URI.scheme,
      url: this.URI.spec,
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
    // TODO: Make sure that we report status updates
    // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIProgressEventSink

    debug && console.log(`asyncOpen${pid} ${JSON.stringify(this)}`)
    switch (this.readyState) {
      case IDLE: {
        this.listener = listener
        this.context = context
        this.status = Cr.NS_OK
        this.loadGroup.addRequest(this, context)
        return this.handler.request(this)
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
    const { handler, readyState } = this
    if (handler) {
      switch (readyState) {
        case ACTIVE:
        case PAUSED: {
          this.setStatus(status)
          return handler.updateRequest(this, Cr.NS_BINDING_ABORTED)
        }
        default: {
          throw this.status
        }
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

  head({ contentType, contentLength, contentCharset }) {
    debug &&
      console.log(
        `head${pid} ${JSON.stringify({
          contentType,
          contentLength,
          contentCharset
        })}`
      )
    if (contentType) {
      this.contentType = contentType
    }
    if (contentLength) {
      this.contentLength = contentLength
    }
    if (contentCharset) {
      this.contentCharset = contentCharset
    }

    this.status = Cr.NS_OK
    this.readyState = ACTIVE

    const { listener, context } = this
    const ctx /*: any */ = context
    this.byteOffset = 0
    try {
      listener && listener.onStartRequest(this, ctx)
    } catch (_) {
      console.error(_)
    }
  }
  body({ content }) {
    const stream = Cc[
      "@mozilla.org/io/arraybuffer-input-stream;1"
    ].createInstance(Ci.nsIArrayBufferInputStream)
    const { byteLength } = content
    stream.setData(content, 0, byteLength)

    debug &&
      console.log(
        `body${pid} ${JSON.stringify(
          this
        )} ${stream.available()} ${byteLength} ${content.toString()} `
      )

    const { listener, context } = this
    const ctx /*: any */ = context
    listener && listener.onDataAvailable(this, ctx, stream, 0, byteLength)
    this.byteOffset += byteLength
  }

  end(_) {
    this.readyState = CLOSED
    this.contentLength = this.byteOffset
    debug && console.log(`end${pid} ${JSON.stringify(this)}`)
    this.close()
  }
  abort() {
    debug && console.log(`abort${pid} ${JSON.stringify(this)}`)
    this.readyState = CANCELED
    this.status = Cr.NS_BINDING_ABORTED
    this.close()
  }
  close() {
    const { listener, context, status } = this
    debug && console.log(`close${pid} ${JSON.stringify(this)}`)
    delete this.listener
    delete this.context
    delete this.handler
    const ctx /*: any */ = context
    try {
      listener && listener.onStopRequest(this, ctx, status)

      this.loadGroup.removeRequest(this, ctx, status)
    } catch (_) {
      debug && console.error(`Failed onStopRequest${pid} ${_}`)
    }
  }
}

class ProtocolHandler /*::implements nsIProtocolHandler*/ {
  /*::
  scheme: string
  defaultPort: number
  handler: RequestHandler
  protocolFlags: number
  */
  constructor(scheme, handler) {
    this.scheme = scheme
    this.defaultPort = -1
    this.handler = handler
    this.protocolFlags =
      Ci.nsIProtocolHandler.URI_STD |
      Ci.nsIProtocolHandler.URI_LOADABLE_BY_SUBSUMERS
  }
  toJSON() {
    return {
      scheme: this.scheme,
      defaultPort: this.defaultPort,
      protocolFlags: this.protocolFlags
    }
  }
  allowPort(port, scheme) {
    return false
  }
  newURI(spec, charset, baseURI) {
    debug &&
      console.log(`newURI${pid} ${spec} ${String(baseURI && baseURI.spec)}`)
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

      return url
    } catch (_) {
      const resolvedSpec = baseURI == null ? spec : baseURI.resolve(spec)

      return Cc["@mozilla.org/network/simple-uri-mutator;1"]
        .createInstance(Ci.nsIURIMutator)
        .setSpec(resolvedSpec)
        .finalize()
    }
  }
  newChannel(uri /*: nsIURI */) {
    debug &&
      console.log(`newChannel(${uri.spec})${pid} ${JSON.stringify(this)}`)
    return this.newChannel2(uri, null)
  }
  newChannel2(uri /*: nsIURI */, loadInfo /*: nsILoadInfo | null */) {
    debug &&
      console.log(`newChannel2(${uri.spec})${pid} ${JSON.stringify(this)}`)

    return this.handler.channel(uri, loadInfo)
  }
  QueryInterface(iid) {
    if (iid.equals(Ci.nsIProtocolHandler) || iid.equals(Ci.nsISupports)) {
      return this
    }
    throw Cr.NS_ERROR_NO_INTERFACE
  }
}

class Factory /*::implements nsIFactory<nsIProtocolHandler>*/ {
  /*::
  instance: nsIProtocolHandler
  */
  constructor(instance /*: nsIProtocolHandler */) {
    this.instance = instance
  }
  createInstance(
    outer /*: null | nsISupports<nsIProtocolHandler> */,
    iid /*: nsIIDRef<nsIProtocolHandler> */
  ) /*: nsIProtocolHandler */ {
    if (outer != null) {
      throw Cr.NS_ERROR_NO_AGGREGATION
    }

    return this.instance
  }
  lockFactory(lock /*: boolean */) /*: void */ {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED
  }
  QueryInterface(
    iid /*: nsIIDRef<nsIFactory<nsIProtocolHandler>> */
  ) /*: nsIFactory<nsIProtocolHandler> */ {
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
const RESPONSE_HEAD = `libdweb:protocol:response:head`
const RESPONSE_BODY = `libdweb:protocol:response:body`
const RESPONSE_END = `libdweb:protocol:response:end`

const AGENT_INBOX = `libdweb:protocol:agent:inbox`
const AGENT_OUTBOX = `libdweb:protocol:agent:outbox`
const HANDLER_INBOX = `libdweb:protocol:handler:inbox`
const HANDLER_OUTBOX = `libdweb:protocol:handler:outbox`

class RequestHandler {
  /*::
  requestID: number
  +requests: { [string]: Channel }
  +pid: string
  QueryInterface: *
  */
  constructor() {
    this.requestID = 0
    this.requests = createDict()
    this.pid = `Handler${pid}`
    this.QueryInterface = XPCOMUtils.generateQI([Ci.nsIMessageListener])
  }
  channel(
    url /*: nsIURI */,
    loadInfo /*: null | nsILoadInfo */
  ) /*: Channel */ {
    const { scheme } = url
    const requestID = `${scheme}:${++this.requestID}:${this.pid}`
    const request = new Channel(url, loadInfo, requestID, this)
    this.requests[requestID] = request
    return request
  }
  request(channel /*: Channel */) {}
  updateRequest(channel /*: Channel */, status /*: RequestStatus */) {}
}

/*::
export type Register = {
  type: "register",
  scheme: string,
  uuid: string
}

export type Unregister = {
  type: "unregister",
  scheme: string,
  uuid: string
}

export type Terminate = {
  type: "terminate"
}

export type Install = {
  type: "install",
  scheme: string
}

export type Head = {
  type: "head",
  requestID: string,
  contentType?: string,
  contentLength?: number,
  contentCharset?: string,
  contentDispositionFilename?: string,
  contentDispositionHeader?:string
}

export type Body = {
  type: "body",
  requestID: string,
  content: ArrayBuffer
}

export type End = {
  type: "end",
  requestID: string
}

export type Response = Head | Body | End

export type HandlerOutbox = {
  name: "libdweb:protocol:handler:outbox",
  data: Install | Response,
  target: { messageManager: Out<HandlerInbox> }
}

export type HandlerInbox = {
  name: "libdweb:protocol:handler:inbox",
  data: Request | RequestUpdate,
  target: Out<HandlerOutbox>
}

export type ProtocolSpec = { scheme: string, uuid: string }

type Request = {
  type: "request",
  requestID: string,
  url: string,
  scheme: string,
  status?: void
}

type RequestUpdate = {
  type: "requestUpdate",
  requestID: string,
  scheme: string,
  status: RequestStatus
}

export type AgentInbox = {
  name: "libdweb:protocol:agent:inbox",
  data: Register | Unregister | Terminate | Response
}

export type AgentOutbox = {
  name: "libdweb:protocol:agent:outbox",
  data: Request | RequestUpdate,
  target: nsIMessageSender<AgentInbox>
}

export type Inn<a> = nsIMessageListenerManager<a>
export type Out<a> = nsIMessageSender<a>
*/
class Supervisor extends RequestHandler {
  /*::
  +protocols: { [string]: ProtocolSpec }
  +handlers: { [string]: Out<HandlerInbox> }
  +agents: { [string]: Out<AgentInbox> }
  +agentsPort: nsIMessageBroadcaster<*, AgentInbox>
  */
  constructor() {
    super()
    this.protocols = createDict()
    this.handlers = createDict()
    this.agents = createDict()

    this.pid = `Supervisor${pid}`

    this.agentsPort = ppmm
  }
  receiveMessage(message /*: AgentOutbox | HandlerOutbox */) {
    debug &&
      console.log(
        `Receive message:${message.name} at ${this.pid} ${JSON.stringify(
          message.data
        )}`,
        message.target
      )

    switch (message.name) {
      case AGENT_OUTBOX:
        return this.receiveAgentMessage(message)
      case HANDLER_OUTBOX:
        return this.receiveHandlerMessage(message)
    }
  }
  receiveAgentMessage({ data, target }) {
    const { handlers, agents, pid } = this
    const { scheme, requestID } = data
    const handler = handlers[scheme]
    if (handler) {
      debug &&
        console.log(
          `-> request${this.pid} ${JSON.stringify(data)}`,
          target,
          handler
        )
      agents[requestID] = target
      handler.sendAsyncMessage(HANDLER_INBOX, data)
    }
  }
  receiveHandlerMessage({ data, target }) {
    switch (data.type) {
      case "install":
        return this.register(data.scheme, target.messageManager)
      default:
        return this.forwardResponse(data)
    }
  }
  forwardResponse(response) {
    debug && console.log(`-> response${this.pid} ${JSON.stringify(response)}`)
    const { agents } = this
    const { requestID } = response
    const agent = agents[requestID]
    if (agent) {
      if (response.type === "end") {
        delete agents[requestID]
      }
      agent.sendAsyncMessage(AGENT_INBOX, response)
    }
  }
  register(scheme /*: string */, handler /*: Out<HandlerInbox> */) {
    const { protocols, handlers } = this
    if (handlers[scheme]) {
      handlers[scheme] = handler
    } else {
      const uuid = generateUUID().toString()
      const protocol = { type: "register", scheme, uuid }
      protocols[scheme] = protocol
      handlers[scheme] = handler
      registerProtocol(protocol, this)
      this.agentsPort.broadcastAsyncMessage(AGENT_INBOX, protocol)
    }
  }
  unregister({ scheme, uuid }) {
    const { protocols, handlers } = this
    if (protocols[scheme] != null) {
      delete protocols[scheme]
      delete handlers[scheme]

      const unregister = { type: "unregister", scheme, uuid }
      unregisterProtocol(scheme)
      this.agentsPort.broadcastAsyncMessage(AGENT_INBOX, unregister)
    }
  }
  terminate() {
    debug && console.log(`Terminate ${this.pid}`)
    const { protocols, requests } = this

    this.agentsPort.broadcastAsyncMessage(AGENT_INBOX, { type: "terminate" })
    ppmm.removeDelayedProcessScript(Components.stack.filename)
    mm.removeMessageListener(HANDLER_OUTBOX, this)
    ppmm.removeMessageListener(AGENT_INBOX, this)

    delete this.request
    delete this.protocols
    delete this.agents
    delete this.handlers

    for (const scheme in protocols) {
      unregisterProtocol(scheme)
    }
  }
  static new() {
    const self = new this()
    debug && console.log(`new ${self.pid}`)
    ppmm.initialProcessData[PROTOCOLS] = self.protocols

    debug &&
      console.log(`initialProcessData`, ppmm.initialProcessData[PROTOCOLS])

    ppmm.loadProcessScript(Components.stack.filename, true)

    mm.addMessageListener(HANDLER_OUTBOX, self)
    ppmm.addMessageListener(AGENT_OUTBOX, self)

    return self
  }
}

class Agent extends RequestHandler {
  /*::
  outbox: Out<AgentOutbox>
  inbox: Inn<AgentInbox>
  protocols: {[string]:ProtocolSpec}
  */
  constructor() {
    super()
    this.pid = `Agent${pid}`
    this.requestID = 0
    this.outbox = cpmm
    this.inbox = cpmm
    this.protocols = createDict()
  }
  register(protocol /*: ProtocolSpec */) {
    const { protocols } = this

    if (protocols[protocol.scheme] == null) {
      protocols[protocol.scheme] = protocol
      registerProtocol(protocol, this)
    }
  }
  unregister(protocol /*: ProtocolSpec*/) {
    const { protocols } = this
    if (protocols[protocol.scheme] != null) {
      delete protocols[protocol.scheme]
      unregisterProtocol(protocol.scheme)
    }
  }
  request(channel /*: Channel */) {
    const { url, scheme, requestID } = channel
    debug && console.log(`request${this.pid} ${JSON.stringify(channel)}`)
    this.outbox.sendAsyncMessage(AGENT_OUTBOX, {
      type: "request",
      requestID,
      url,
      scheme
    })
  }
  updateRequest(channel /*: Channel */, status /*: RequestStatus */) {
    const { url, scheme, requestID } = channel
    debug && console.log(`request${this.pid} ${JSON.stringify(channel)}`)
    this.outbox.sendAsyncMessage(AGENT_OUTBOX, {
      type: "requestUpdate",
      requestID,
      status,
      url,
      scheme
    })
  }
  head(head) {
    this.requests[head.requestID].head(head)
  }
  body(body) {
    this.requests[body.requestID].body(body)
  }
  end(end) {
    this.requests[end.requestID].end(end)
  }
  receiveMessage({ data } /*: AgentInbox */) {
    debug &&
      console.log(`Receive message at ${this.pid} ${JSON.stringify(data)}`)

    switch (data.type) {
      case "terminate":
        return this.terminate(data)
      case "unregister":
        return this.unregister(data)
      case "register":
        return this.register(data)
      case "head":
        return this.head(data)
      case "body":
        return this.body(data)
      case "end":
        return this.end(data)
    }
  }

  terminate(_) {
    debug && console.log(`Terminate ${this.pid}`)

    const { protocols, requests } = this
    this.inbox.removeMessageListener(AGENT_INBOX, this)

    delete this.protocols
    delete this.outbox
    delete this.inbox

    for (const requestID in requests) {
      const request = requests[requestID]
      request.abort()
    }

    for (const scheme in protocols) {
      unregisterProtocol(scheme)
    }
  }

  static new() {
    const self = new Agent()
    debug && console.log(`new ${self.pid}`)

    self.inbox.addMessageListener(AGENT_INBOX, self)

    const protocols /*: { [string]: ProtocolSpec } */ =
      cpmm.initialProcessData[PROTOCOLS]
    console.log(`Initial protocols ${JSON.stringify(protocols)}`)

    if (protocols) {
      for (let scheme in protocols) {
        self.register(protocols[scheme])
      }
    }
  }
}

if (!isParent) {
  Agent.new()
}

const self /*:window*/ = this
self.Supervisor = Supervisor
self.Agent = Agent

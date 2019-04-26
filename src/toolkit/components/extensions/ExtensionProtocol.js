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
  nsIUploadChannel2,
  nsISupports,
  nsITransportSecurityInfo,
  nsIChannelEventSink,
  nsIMessageListener,
  nsIMessageSender,
  nsIMessageBroadcaster,
  nsIMessageListenerManager,
  nsIProgressEventSink,
  nsIInputStream,
  nsIBinaryInputStream,
  nsIInputStreamPump,
  nsIWritablePropertyBag2
} from "gecko"

import type {
  Out,
  Inn,
  AgentOutbox,
  RequestMessage,
  ReadyState,
  ProtocolSpec,
  HandlerInbox,
  AgentInbox,
  HandlerOutbox,
  ResponseMessage,
  RequestHandler,
  AgentInboxMessage,
  AgentOutboxMessage,
  Register,
  Unregister,
  RegisterProtocol,
  UnregisterProtocol,
  Port
} from "./interface/protocol.js"
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

const { setTimeout } = Cu.import("resource://gre/modules/Timer.jsm", {})
const { console } = Cu.import("resource://gre/modules/Console.jsm", {})
const PR_UINT32_MAX = 0xffffffff
const { generateUUID } = Cc["@mozilla.org/uuid-generator;1"].getService(
  Ci.nsIUUIDGenerator
)

const contentSecManager = Cc[
  "@mozilla.org/contentsecuritymanager;1"
].getService(Ci.nsIContentSecurityManager)

const isParent = appinfo.processType === appinfo.PROCESS_TYPE_DEFAULT
const { ID } = Components

const componentRegistrar = Cm.QueryInterface(Ci.nsIComponentRegistrar)
const pid = `@${appinfo.processType}#${appinfo.processID}`

const getFactoryByCID = cid => Cm.getClassObject(cid, Ci.nsIFactory)

const getInterfaceByID = iid => {
  for (const value /*:any*/ of Object.values(Ci)) {
    if (iid.equals(value)) {
      return value
    }
  }
  return iid
}

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

const registerProtocol = ({ scheme, uuid } /*:ProtocolSpec*/, handler) => {
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

class TransportSecurityInfo /*::implements nsITransportSecurityInfo*/ {
  /*::
  securityState:nsWebProgressState
  shortSecurityDescription:string
  errorCode:nsresult
  errorMessage:string
  SSLStatus:*
  state:string
  */
  constructor() {
    this.state = "secure"
    this.securityState = Ci.nsIWebProgressListener.STATE_IS_SECURE
    this.errorCode = Cr.NS_OK
    this.shortSecurityDescription = "Content Addressed"
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
  QueryInterface(iid) {
    const isSupported =
      false ||
      iid.equals(Ci.nsISupports) ||
      iid.equals(Ci.nsITransportSecurityInfo) ||
      iid.equals(Ci.nsISSLStatusProvider)
    if (isSupported) {
      return this
    } else {
      throw Cr.NS_ERROR_NO_INTERFACE
    }
  }
}

const MAX_UNKNOWN = 0xffffffffffffffff
const UNKNOWN_CONTENT_TYPE = "application/x-unknown-content-type"

class Channel /*::implements nsIChannel, nsIUploadChannel2, nsIRequest, nsIWritablePropertyBag2*/ {
  /*::
  port: Port<RequestMessage>
  URI: nsIURI
  scheme: string
  url: string
  originalURI: nsIURI
  loadInfo: null | nsILoadInfo
  contentCharset: ?string
  contentLength: number
  mimeType: ?string
  byteOffset: number
  id: string
  owner: nsISupports<*> | null
  securityInfo: nsITransportSecurityInfo | null
  loadFlags: nsLoadFlags
  loadGroup: nsILoadGroup
  name: string
  status: nsresult
  readyState: ReadyState
  contentDisposition: number
  contentDispositionFilename: string
  contentDispositionHeader: string
  notificationCallbacks: nsIInterfaceRequestor<nsIProgressEventSink> | null;

  listener: ?nsIStreamListener
  context: ?nsISupports<mixed>
  properties: {[string]:any};
  body:?RequestBody
  method:string
  */
  constructor(
    port /*:Port<RequestMessage>*/,
    uri /*: nsIURI */,
    loadInfo /*: null | nsILoadInfo */,
    id /*: string */
  ) {
    this.port = port
    this.URI = uri
    this.url = uri.spec
    this.scheme = uri.scheme
    this.originalURI = uri
    this.loadInfo = loadInfo
    this.originalURI = uri
    this.contentCharset = "utf-8"
    this.contentLength = -1
    this.mimeType = null
    this.contentDispositionFilename = ""
    this.contentDispositionHeader = ""
    this.byteOffset = 0
    this.id = id

    this.owner = null
    this.securityInfo = new TransportSecurityInfo()
    this.notificationCallbacks = null
    this.loadFlags = Ci.nsIRequest.LOAD_NORMAL
    this.name = uri.spec
    this.status = Cr.NS_ERROR_NOT_INITIALIZED
    this.readyState = IDLE

    this.properties = {}
    this.method = "GET"
    this.body = null
  }
  QueryInterface(iid) {
    console.log(`Channel.QueryInterface ${getInterfaceByID(iid)}`)
    const isSupported =
      false ||
      iid.equals(Ci.nsISupports) ||
      iid.equals(Ci.nsIChannel) ||
      iid.equals(Ci.nsIRequest) ||
      iid.equals(Ci.nsIPropertyBag2) ||
      iid.equals(Ci.nsIPropertyBag) ||
      iid.equals(Ci.nsIWritablePropertyBag2) ||
      // iid.equals(Ci.nsIApplicationCacheChannel) ||
      // iid.equals(Ci.nsIMultiPartChannel) ||
      // iid.equals(Ci.nsIFileChannel) ||
      // iid.equals(Ci.nsITimedChannel) ||
      // iid.equals(Ci.nsIInputStreamChannel) ||
      iid.equals(Ci.nsIUploadChannel2)
    if (isSupported) {
      return this
    } else {
      throw Cr.NS_ERROR_NO_INTERFACE
    }
  }

  // nsIUploadChannel2
  explicitSetUploadStream(
    stream,
    contentType,
    contentLength,
    method,
    streamHasHeaders
  ) {
    console.log(
      `nsIUploadChannel2.explicitSetUploadStream`,
      stream,
      contentType,
      contentLength,
      method,
      streamHasHeaders
    )
    console.log(
      "!!!!!!!!!!!!!!!!!!",
      JSON.stringify({
        available: stream.available(),
        isNonBlocking: stream.isNonBlocking()
      })
    )

    this.setPropertyAsAString("content-type", contentType)
    this.setPropertyAsAString("content-length", contentLength)
    this.contentType = contentType
    this.method = method

    // If content length is `0` e.g `fetch(url, {method:"PUT", body:""})` no
    // point in doing all the IPC back and forth so we just treat as no body.
    if (contentLength !== 0) {
      this.body = RequestBody.new(
        this.port,
        this.id,
        this.scheme,
        streamHasHeaders,
        contentLength,
        stream
      )
    }
  }

  get contentType() {
    const { mimeType } = this
    if (mimeType != null) {
      return mimeType
    } else {
      return UNKNOWN_CONTENT_TYPE
    }
  }
  set contentType(_) {}
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

    debug && console.log(`Channel.asyncOpen${pid} ${JSON.stringify(this)}`)
    switch (this.readyState) {
      case IDLE: {
        this.listener = listener
        this.context = context
        this.status = Cr.NS_OK
        this.loadGroup.addRequest(this, context)
        return this.start()
      }
      default: {
        throw this.status
      }
    }
  }

  // nsIRequest

  start() {
    const { url, scheme, id, method, properties, body } = this
    // debug && console.log(`Agent.request ${this.pid} ${JSON.stringify(channel)}`)
    this.port.send({
      type: "start-request",
      id,
      scheme,

      url,
      contentLength: body == null ? 0 : body.contentLength,
      method,

      headers: properties
    })
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
    debug &&
      console.log(`Channel.cancel (${status})${pid} ${JSON.stringify(this)}`)
    const { readyState, port } = this
    switch (readyState) {
      case ACTIVE:
      case PAUSED: {
        this.setStatus(status)
        return this.port.send({
          type: "cancel-request",
          id: this.id,
          scheme: this.scheme
        })
      }
      default: {
        throw this.status
      }
    }
  }
  suspend() {
    debug && console.log(`Channel.suspend ${pid} ${JSON.stringify(this)}`)
    switch (this.readyState) {
      case ACTIVE: {
        this.readyState = PAUSED
        return this.port.send({
          type: "suspend-request",
          id: this.id,
          scheme: this.scheme
        })
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
    debug && console.log(`Channel.resume ${pid} ${JSON.stringify(this)}`)
    switch (this.readyState) {
      case ACTIVE: {
        return void this
      }
      case PAUSED: {
        this.readyState = ACTIVE
        return this.port.send({
          type: "resume-request",
          id: this.id,
          scheme: this.scheme
        })
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

  // ResponseReceiver

  receiveResponse(message /*:ResponseMessage*/) {
    switch (message.type) {
      case "start-response": {
        return this.onStartResponse(message)
      }
      case "write-response-stream": {
        return this.onWriteResponseStream(message)
      }
      case "close-response-stream": {
        return this.onCloseResponseStream(message)
      }
      case "error-response-stream": {
        return this.onErrorResponseStream(message)
      }
      case "suspend-request-stream": {
        return this.onSuspendRequestStream(message)
      }
      case "resume-request-stream": {
        return this.onResumeRequestStream(message)
      }
      case "cancel-request-stream": {
        return this.onCancelRequestStream(message)
      }
    }
  }
  onStartResponse({ ok, status, statusText, headers }) {
    const contentType = headers["content-type"] || ""
    const contentLength = headers["content-length"] || ""
    const [mimeType] = contentType.split(";")
    const [, contentCharset] = /charset=([^;]+)/.exec(contentType) || []

    debug &&
      console.log(
        `Channel.onStartResponse ${pid} ${JSON.stringify({
          ok,
          status,
          statusText,
          headers,

          contentType,
          contentLength,
          mimeType,
          contentCharset
        })}`
      )

    if (mimeType != "") {
      this.mimeType = mimeType
    }

    if (contentLength != null && contentCharset !== "") {
      this.contentLength = parseInt(contentLength)
    }

    if (contentCharset != "") {
      this.contentCharset = contentCharset
    }

    this.status = Cr.NS_OK
    this.readyState = ACTIVE
    this.byteOffset = 0

    // If contentType is known start request, otherwise defer until it
    // can be inferred on first data chunk.
    if (this.mimeType != null) {
      const { listener } = this
      try {
        console.log(`Channel.listener.onStartRequest ${this.mimeType}`)
        listener && listener.onStartRequest(this)
      } catch (_) {
        console.error(_)
      }
    }
  }
  onWriteResponseStream({ buffer }) {
    console.log(
      `Channel.onWriteResponseStream ${typeof buffer} ${String(buffer)} )}`
    )
    const stream = streamFromBuffer(buffer)
    const { listener, context } = this

    // If mimeType is not set then we need detect it from the arrived content
    // and start request. We know start was deffered so that we would could
    // detect contentType.
    if (this.mimeType == null) {
      try {
        const contentSniffer = Cc[
          "@mozilla.org/network/content-sniffer;1"
        ].createInstance(Ci.nsIContentSniffer)
        this.mimeType = contentSniffer.getMIMETypeFromContent(
          this,
          new Uint8Array(buffer),
          stream.available()
        )
      } catch (_) {}

      console.log(`Channel.listener.onStartRequest ${this.mimeType}`)
      listener && listener.onStartRequest(this)
    }

    debug &&
      console.log(
        `>>> Channel.body ${pid} ${stream.available()} ${new TextDecoder().decode(
          new Uint8Array(buffer)
        )}`
      )

    const byteLength = stream.available()

    try {
      listener && listener.onDataAvailable(this, stream, 0, byteLength)
      this.byteOffset += byteLength

      debug && console.log(`<<< Channel.body ${pid} `)
    } catch (error) {
      console.log(error + "")
    }
  }
  onCloseResponseStream(message) {
    this.stop()
  }
  onErrorResponseStream(message) {
    this.setStatus(Cr.NS_ERROR_XPC_JAVASCRIPT_ERROR_WITH_DETAILS)
    this.stop()
  }

  onSuspendRequestStream(message) {
    const { body } = this
    if (body) {
      body.suspend()
    }
  }
  onResumeRequestStream(message) {
    const { body } = this
    if (body) {
      body.resume()
    }
  }
  onCancelRequestStream(message) {
    const { body } = this
    if (body) {
      body.cancel()
    }
  }

  stop() {
    console.log(`Channel.stop ${pid} ${JSON.stringify(this)}`)
    this.readyState = CLOSED
    this.contentLength = this.byteOffset
    const { listener, context, status, readyState } = this
    try {
      if (this.body) {
        this.body.cancel()
      }
      if (status != Cr.NS_BINDING_ABORTED) {
        listener && listener.onStopRequest(this, status)
        this.loadGroup.removeRequest(this, context, status)
      }
    } catch (_) {
      debug && console.error(`Failed onStopRequest${pid} ${_} `)
    }

    this.dispose()
  }

  dispose() {
    delete this.context
    delete this.listener
    delete this.port
  }

  // nsIWritablePropertyBag2

  setPropertyAsInt32(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsUint32(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsInt64(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsUint64(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsDouble(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsAString(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsACString(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsAUTF8String(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsBool(name, value) {
    this.setPropertyAsInterface(name, value)
  }
  setPropertyAsInterface(name, value /*:mixed*/) {
    console.log(`Channel.setPropertyAs*(${name}, ${String(value)})`)
    this.properties[name] = value
  }

  get enumerator() {
    throw Error("Not implemented")
  }
  getPropertyAsInt32(name) {
    return this.get(name)
  }
  getPropertyAsUint32(name) {
    return this.get(name)
  }
  getPropertyAsInt64(name) {
    return this.get(name)
  }
  getPropertyAsUint64(name) {
    return this.get(name)
  }
  getPropertyAsDouble(name) {
    return this.get(name)
  }
  getPropertyAsAString(name) {
    return this.get(name)
  }
  getPropertyAsACString(name) {
    return this.get(name)
  }
  getPropertyAsAUTF8String(name) {
    return this.get(name)
  }
  getPropertyAsBool(name) {
    return this.get(name)
  }

  getProperty(name) {
    return this.get(name)
  }
  getPropertyAsInterface(name) {
    return this.get(name)
  }

  get(name) /*:any*/ {
    const value = this.properties[name]
    console.log(`Channel.getPropertyAs*(${name}, ${String(value)})`)
    return value
  }

  hasKey(name) {
    return name in this.properties
  }
}

const streamFrom = (data /*:string|ArrayBuffer*/) /*:nsIInputStream*/ =>
  typeof data === "string" ? streamFromString(data) : streamFromBuffer(data)

const streamFromString = (data /*:string*/) => {
  const stream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(
    Ci.nsIStringInputStream
  )
  stream.setData(data, data.length)
  return stream
}

const streamFromBuffer = (buffer /*:ArrayBuffer*/) => {
  const stream = Cc[
    "@mozilla.org/io/arraybuffer-input-stream;1"
  ].createInstance(Ci.nsIArrayBufferInputStream)

  const { byteLength } = buffer
  stream.setData(buffer, 0, byteLength)
  return stream
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

class Supervisor {
  /*::
  +pid:string;
  +protocols: { [string]: ProtocolSpec };
  +handlers: { [string]: Out<HandlerInbox> };
  +agents: { [string]: Port<AgentInboxMessage> };
  +agentsPort: nsIMessageBroadcaster<*, AgentInbox>;
  +id:number
  +requests: { [string]: Channel }
  */
  constructor() {
    this.protocols = createDict()
    this.handlers = createDict()
    this.agents = createDict()

    this.pid = `Supervisor${pid}`

    this.agentsPort = ppmm
    this.id = 0
    this.requests = {}
  }
  receiveMessage(message /*: AgentOutbox | HandlerOutbox */) {
    debug &&
      console.log(
        `Supervisor.receiveMessage "${message.name}" at ${
          this.pid
        } ${JSON.stringify(message.data)}`,
        message.target
      )

    switch (message.name) {
      case AGENT_OUTBOX:
        return this.receiveAgentMessage(message)
      case HANDLER_OUTBOX:
        return this.receiveHandlerMessage(message)
    }
  }
  receiveAgentMessage({ data, target } /*:AgentOutbox*/) {
    const { handlers, agents, pid } = this
    const { scheme, id } = data
    const handler = handlers[scheme]
    if (handler) {
      debug &&
        console.log(
          `Supervisor.receiveAgentMessage ${this.pid} ${JSON.stringify(data)}`,
          target,
          handler
        )
      agents[id] = new AgentPort(target)
      handler.sendAsyncMessage(HANDLER_INBOX, data)
    }
  }
  send(message /*:RequestMessage*/) {
    const { handlers, pid } = this
    const { scheme, id } = message
    const handler = handlers[scheme]
    if (handler) {
      debug &&
        console.log(
          `Supervisor.send ${this.pid} ${JSON.stringify(message)}`,
          handler
        )
      handler.sendAsyncMessage(HANDLER_INBOX, message)
    }
  }
  receiveHandlerMessage({ data, target } /*:HandlerOutbox*/) {
    switch (data.type) {
      case "register":
        return this.register(data, target.messageManager)
      case "unregister":
        return this.unregister(data)
      default:
        return this.forwardResponse(data)
    }
  }
  forwardResponse(response /*:ResponseMessage*/) {
    debug &&
      console.log(
        `Supervisor.forwardResponse ${this.pid} ${JSON.stringify(response)}`
      )
    const { agents, requests } = this
    const { id } = response
    const agent = agents[id]
    const request = requests[id]
    switch (response.type) {
      case "close-response-stream":
      case "error-response-stream": {
        delete agents[id]
        delete requests[id]
      }
    }

    if (agent) {
      agent.send(response)
    }
    if (request) {
      request.receiveResponse(response)
    }
  }
  register(
    { scheme, id } /*:RegisterProtocol*/,
    handler /*: Out<HandlerInbox> */
  ) {
    const { protocols, handlers } = this
    if (handlers[scheme]) {
      handlers[scheme] = handler
    } else {
      const uuid = generateUUID().toString()
      const register = { type: "register", scheme, uuid, id }
      protocols[scheme] = register
      handlers[scheme] = handler
      registerProtocol(register, this)
      this.agentsPort.broadcastAsyncMessage(AGENT_INBOX, register)
    }
  }
  unregister({ scheme, id } /*:UnregisterProtocol*/) {
    const { protocols, handlers } = this
    const protocol = protocols[scheme]
    if (protocol != null) {
      delete protocols[scheme]
      delete handlers[scheme]

      unregisterProtocol(scheme)
      this.agentsPort.broadcastAsyncMessage(AGENT_INBOX, {
        type: "unregister",
        scheme,
        id,
        uuid: protocol.uuid
      })
    }
  }
  terminate() {
    debug && console.log(`Supervisor.terminate ${this.pid}`)
    const { protocols } = this

    this.agentsPort.broadcastAsyncMessage(AGENT_INBOX, { type: "terminate" })
    ppmm.removeDelayedProcessScript(Components.stack.filename)
    mm.removeMessageListener(HANDLER_OUTBOX, this)
    ppmm.removeMessageListener(AGENT_INBOX, this)

    delete this.protocols
    delete this.agents
    delete this.handlers

    for (const scheme in protocols) {
      unregisterProtocol(scheme)
    }
  }
  newChannel(url /*: nsIURI */, loadInfo /*: nsILoadInfo */) /*: Channel */ {
    const { scheme } = url
    const { handlers } = this
    const id = `${url.scheme}:${++this.id}:${this.pid}`
    const request = new Channel(this, url, loadInfo, id)
    this.requests[id] = request
    return request
  }

  static new() {
    const self = new this()
    debug && console.log(`Supervisor.new ${self.pid}`)
    ppmm.initialProcessData[PROTOCOLS] = self.protocols

    debug &&
      console.log(`initialProcessData`, ppmm.initialProcessData[PROTOCOLS])

    ppmm.loadProcessScript(Components.stack.filename, true)

    mm.addMessageListener(HANDLER_OUTBOX, self)
    ppmm.addMessageListener(AGENT_OUTBOX, self)

    return self
  }
}

class AgentPort {
  /*::
  +outbox: Out<AgentInbox>
  */
  constructor(outbox /*:Out<AgentInbox>*/) {
    this.outbox = outbox
  }
  send(message /*:AgentInboxMessage*/) {
    this.outbox.sendAsyncMessage(AGENT_INBOX, message)
  }
}

class RequestBody {
  /*::
  port:Port<RequestMessage>;
  scheme:string;
  id:string;
  inputStream:nsIInputStream;
  binaryInputStream:nsIBinaryInputStream;
  inputStreamPump:nsIInputStreamPump;
  includesHeaders:boolean;
  contentLength:number;
  readyState:ReadyState
  */
  static new(
    port /*:Port<RequestMessage>*/,
    id /*:string*/,
    scheme /*:string*/,
    includesHeaders /*:boolean*/,
    contentLength /*:number*/,
    inputStream /*:nsIInputStream*/
  ) {
    const binaryInputStream = Cc[
      "@mozilla.org/binaryinputstream;1"
    ].createInstance(Ci.nsIBinaryInputStream)
    binaryInputStream.setInputStream(inputStream)
    const inputStreamPump = Cc[
      "@mozilla.org/network/input-stream-pump;1"
    ].createInstance(Ci.nsIInputStreamPump)
    inputStreamPump.init(inputStream, 0, 0, true, null)

    return new RequestBody(
      port,
      id,
      scheme,
      includesHeaders,
      contentLength,
      inputStream,
      binaryInputStream,
      inputStreamPump
    )
  }
  constructor(
    port /*:Port<RequestMessage>*/,
    id /*:string*/,
    scheme /*:string*/,
    includesHeaders /*:boolean*/,
    contentLength /*:number*/,
    inputStream /*:nsIInputStream*/,
    binaryInputStream /*:nsIBinaryInputStream*/,
    inputStreamPump /*:nsIInputStreamPump*/
  ) {
    this.port = port
    this.scheme = scheme
    this.id = id
    this.includesHeaders = includesHeaders
    this.contentLength = contentLength
    this.inputStream = inputStream
    this.binaryInputStream = binaryInputStream
    this.inputStreamPump = inputStreamPump
    this.readyState = IDLE
  }
  onStartRequest(request, context) {}
  onDataAvailable(
    request /*: nsIRequest*/,
    inputStream /*: nsIInputStream*/,
    offset /*: number*/,
    size /*: number*/
  ) {
    const buffer = new ArrayBuffer(size)
    this.binaryInputStream.readArrayBuffer(size, buffer)
    this.enqueue(buffer)
  }
  onStopRequest(request, status) {
    switch (status) {
      case Cr.NS_OK:
        return this.close()
      case Cr.NS_BINDING_ABORTED:
        return undefined
      default:
        return this.error(status)
    }
  }

  activate() {
    switch (this.readyState) {
      case IDLE: {
        this.readyState = ACTIVE
        return this.inputStreamPump.asyncRead(this, null)
      }
    }
  }

  // Methods correspond to

  enqueue(buffer) {
    const { id, scheme } = this
    this.port.send({
      type: "write-request-stream",
      id,
      scheme,
      buffer
    })
  }
  close() {
    const { id, scheme } = this
    this.port.send({
      type: "close-request-stream",
      id,
      scheme
    })
    this.inputStream.close()
    this.binaryInputStream.close()
    this.dispose()
  }
  error(status) {
    const { id, scheme } = this
    this.port.send({
      type: "error-request-stream",
      id,
      scheme,
      message: String(status)
    })
    this.inputStreamPump.cancel(status)
    this.inputStream.close()
    this.binaryInputStream.close()
    this.dispose()
  }

  // Following methads are invoked in effect to `request.body` consumption.
  // `resume` is invoked in effect to `underlyingSource.pull(controller)`
  // `suspend` is invoked when `controller.desiredSize <= 0`
  // `cancel` is inovked in effect to `underlyingSource.cancel`
  suspend() {
    switch (this.readyState) {
      case ACTIVE: {
        this.readyState = PAUSED
        return this.inputStreamPump.suspend()
      }
    }
  }
  resume() {
    switch (this.readyState) {
      case IDLE: {
        return this.activate()
      }
      case PAUSED: {
        this.readyState = ACTIVE
        return this.inputStreamPump.resume()
      }
    }
  }
  cancel(status /*:nsresult*/ = Cr.NS_BINDING_ABORTED) {
    if (this.port) {
      this.inputStreamPump.cancel(status)
      this.inputStream.close()
      this.binaryInputStream.close()
    }
    this.dispose()
  }

  dispose() {
    delete this.port
    delete this.inputStreamPump
    delete this.inputStream
    delete this.binaryInputStream
  }
}

class Agent {
  /*::
  id: number
  +pid: string
  +requests: { [string]: Channel }
  +outbox: Out<AgentOutbox>
  +inbox: ?Inn<AgentInbox>
  +protocols: {[string]:ProtocolSpec}
  */
  constructor(outbox /*:Out<AgentOutbox>*/, inbox /*:?Inn<AgentInbox>*/) {
    this.outbox = outbox
    this.id = 0
    this.pid = `Agent${pid}`
    this.inbox = inbox
    this.protocols = createDict()
    this.requests = createDict()
  }
  QueryInterface(iid /*: nsIIDRef<nsIMessageListener<any>> */) {
    if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIMessageListener)) {
      return this
    }
    throw Cr.NS_ERROR_NO_INTERFACE
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
  receiveResponse(data /*:ResponseMessage*/) {
    const request = this.requests[data.id]
    if (request) {
      request.receiveResponse(data)
    } else {
      throw Error(`Request ${request.id} not found`)
    }
  }
  receiveMessage({ data } /*: AgentInbox */) {
    debug &&
      console.log(`Agent.receiveMessage at ${this.pid} ${JSON.stringify(data)}`)

    switch (data.type) {
      case "terminate":
        return this.terminate()
      case "unregister":
        return this.unregister(data)
      case "register":
        return this.register(data)
      default:
        return this.receiveResponse(data)
    }
  }
  send(message /*:AgentOutboxMessage*/) {
    this.outbox.sendAsyncMessage(AGENT_OUTBOX, message)
  }

  newChannel(url /*: nsIURI */, loadInfo /*: nsILoadInfo */) /*: Channel */ {
    const id = `${url.scheme}:${++this.id}:${this.pid}`
    const request = new Channel(this, url, loadInfo, id)
    this.requests[id] = request
    return request
  }

  terminate() {
    debug && console.log(`Agent.terminate ${this.pid}`)

    const { protocols, requests } = this
    if (this.inbox) {
      this.inbox.removeMessageListener(AGENT_INBOX, this)
    }

    delete this.protocols
    delete this.outbox
    delete this.inbox

    for (const id in requests) {
      const request = requests[id]
      request.cancel()
    }

    for (const scheme in protocols) {
      unregisterProtocol(scheme)
    }
  }

  static new() {
    const [outbox, inbox] = [cpmm, cpmm]
    const self = new Agent(outbox, inbox)
    debug && console.log(`Agent.new ${self.pid}`)

    inbox.addMessageListener(AGENT_INBOX, self)

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
      Ci.nsIProtocolHandler.URI_IS_UI_RESOURCE |
      Ci.nsIProtocolHandler.URI_IS_POTENTIALLY_TRUSTWORTHY
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
      console.log(
        `ProtocolHandler.newURI ${pid} ${spec}  ${String(
          baseURI && baseURI.spec
        )}`
      )

    return Cc["@mozilla.org/network/standard-url-mutator;1"]
      .createInstance(Ci.nsIStandardURLMutator)
      .init(
        Ci.nsIStandardURL.URLTYPE_AUTHORITY,
        this.defaultPort,
        spec,
        charset,
        baseURI
      )
      .finalize()
  }
  newChannel(uri /*: nsIURI */, loadInfo /*: nsILoadInfo */) {
    debug &&
      console.log(
        `ProtocolHandler.newChannel (${uri.spec})${pid} ${JSON.stringify(this)}`
      )

    return this.handler.newChannel(uri, loadInfo)
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
    console.log(`Factory.QueryInterface ${iid.name} ${iid.number}\n`)
    throw Cr.NS_ERROR_NO_INTERFACE
  }
}

if (!isParent) {
  Agent.new()
}

const self /*:window*/ = this
self.Supervisor = Supervisor
self.Agent = Agent

/*::
export {Supervisor, Agent}
*/

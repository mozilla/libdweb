const EXPORTED_SYMBOLS = ['registerProtocol'];



const {
  classes: Cc,
  interfaces: Ci,
  utils: Cu,
  results: Cr,
  manager: Cm
} = Components
const { ppmm, cpmm, appinfo } = Cu.import("resource://gre/modules/Services.jsm", {}).Services
const { getConsole } = Cu.import("resource://gre/modules/ExtensionUtils.jsm", {}).ExtensionUtils
const { XPCOMUtils } = Cu.import("resource://gre/modules/XPCOMUtils.jsm", {})
const PR_UINT32_MAX = 0xffffffff;

XPCOMUtils.defineLazyGetter(this, "console", getConsole);
const contentSecManager = Cc["@mozilla.org/contentsecuritymanager;1"]
                          .getService(Ci.nsIContentSecurityManager);


const isParent = appinfo.processType === appinfo.PROCESS_TYPE_DEFAULT
const { ID } = Components

const componentRegistrar = Cm.QueryInterface(Ci.nsIComponentRegistrar)

const installProtocol = (scheme, uuid) => {
  const cid = ID(uuid)
  const description = `${scheme} protocol handler`
  const contractID = `@mozilla.org/network/protocol;1?name=${scheme}`
  const factory = new Factory(new ProtocolHandler(scheme))
  componentRegistrar.registerFactory(cid, description, contractID, factory)
  console.log(
    `registerFactory ${appinfo.processID}@${appinfo.processType}`,
    cid.toString(),
    contractID,
    factory.instance.scheme,
    Cm.isContractIDRegistered(contractID)
  )
}
const registerProtocol = (scheme, uuid) => {
  ppmm.broadcastAsyncMessage(subject, { scheme, uuid })
  installProtocol(scheme, uuid)
}
this.registerProtocol = registerProtocol

class Request {
  constructor(uri, loadInfo) {
    this.uri = uri
    this.loadInfo = loadInfo
  }
  get url() {
    return this.uri.spec
  }
}

class AsyncIteratorToAsyncOutputStreamCopier {
  constructor(asyncIterator, asyncOutputStream) {
    this.asyncIterator = asyncIterator
    this.asyncOutputStream = asyncOutputStream

    this.onInputChunk = this.onInputChunk.bind(this)
    this.onInputError = this.onInputError.bind(this)

    this.next = null
    this.writable = false
  }
  newBinaryOutputStream() {
    const binaryOutputStream = Cc[
      "@mozilla.org/binaryoutputstream;1"
    ].createInstance(Ci.nsIBinaryOutputStream)
    binaryOutputStream.setOutputStream(this.asyncOutputStream)
    return (this.binaryOutputStream = binaryOutputStream)
  }
  onInputChunk(next) {
    console.log(`chunk ${JSON.stringify(next)}`)
    if (this.asyncIterator) {
      this.next = next
      this.onStatusUpdate()
    }
  }
  onInputError(error) {
    console.log(`IO.error ${error}`)
    this.close(Cr.NS_ERROR_FAILURE)
    throw error
  }
  onStatusUpdate() {
    console.log(`status ${JSON.stringify(this.next)}`)
    if (this.asyncIterator === null) {
      return void this
    } else if (this.next === null) {
      return void this
    } else if (this.next.done === true) {
      return this.close()
    } else if (this.writable === false) {
      return void this
    } else {
      return this.write(this.next.value)
    }
  }

  write(chunk) {
    this.next = null
    this.writable = false

    const output = this.binaryOutputStream || this.newBinaryOutputStream()
    console.log(`write bytes ${JSON.stringify(chunk)}`)
    output.writeByteArray(chunk, chunk.byteLength)
    this.flush()
    this.copy()
  }
  flush() {
    try {
      this.asyncOutputStream.flush()
      return true
    } catch (error) {
      switch (error.result) {
        case Cr.NS_BASE_STREAM_WOULD_BLOCK:
        case Cr.NS_ERROR_FAILURE: {
          return false
        }
        default: {
          this.close(error.result)
          throw error
        }
      }
    }
  }
  close(reason = Cr.NS_BASE_STREAM_CLOSED) {
    const { asyncOutputStream, binaryOutputStream } = this
    this.writable = false
    this.next = null
    this.binaryOutputStream = null
    this.asyncOutputStream = null
    this.asyncIterator = null

    asyncOutputStream.closeWithStatus(reason)
    binaryOutputStream.close()
    console.log('Close!')
  }
  onOutputStreamReady(outputStream) {
    if (this.asyncIterator) {
      this.writable = true
      this.onStatusUpdate()
    }
  }
  copy() {
    this.asyncIterator.next().then(this.onInputChunk, this.onInputError)
    this.asyncOutputStream.asyncWait(this, 0, 0, null)
  }
}


const Channel$QueryInterface = XPCOMUtils.generateQI([Ci.nsIChannel, Ci.nsIRequest])
const LOAD_NORMAL = 0

const IDLE = 0
const ACTIVE = 1
const PAUSED = 2
const CANCELED = 3
const CLOSED = 4
const FAILED = 5

const abort = {}

class Channel {
  constructor(uri, loadInfo, response) {
    this.URI = uri
    this.originalURI = uri
    this.loadInfo = loadInfo
    this.originalURI = null
    this.contentCharset = response.contentCharset || "utf-8"
    this.contentLength = response.contentLength || -1
    this.contentType = response.contentType || "text/plain"
    this.content = response.content

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
  asyncOpen(listener, context) {
    console.log(`OPEN ${this.readyState}`)
    switch (this.readyState) {
      case IDLE: {
        this.listener = listener
        this.context = context
        this.awake()
      }
      default: {
        throw this.status
      }
    }
  }
  close(status = this.status) {
    const { listener, context } = this
    this.listener = null
    this.context = null
    try {
      listener.onStopRequest(this, context, status)
    } catch(_) {
      
    }
  }
  ensureActive() {
    switch (this.readyState) {
      case ACTIVE: {
        return this
      }
      default: {
        throw abort
      }
    }
  }
  async awake() {
    try {
      console.log('awake')
      const { listener, context } = this
      this.status = Cr.NS_OK
      this.readyState = ACTIVE
      listener.onStartRequest(this, context)
      console.log(`onStartRequest ${this.status}`)
      this.ensureActive()

      for await (const chunk of this.content) {
        const stream = Cc["@mozilla.org/io/arraybuffer-input-stream;1"]
          .createInstance(Ci.nsIArrayBufferInputStream)
        const { buffer } = chunk
        stream.setData(buffer, 0, buffer.byteLength)
        
        console.log(`onDataAvailable ${chunk}`)
        listener.onDataAvailable(this, context, stream, 0, stream.available());

        this.ensureActive()
      }

      console.log(`CLOSE`)
      this.readyState = CLOSED
      this.status = Cr.NS_BASE_STREAM_CLOSED
      this.close(Cr.NS_OK)
    } catch(error) {
      console.log(`ABORT ${error}`)
      if (error === abort) {
        switch (this.readyState) {
          case ACTIVE:
          case PAUSED: {
            return void this
          }
          case CLOSED:
          case FAILED: {
            return this.close()
          }
          default: {
            this.status = Cr.NS_ERROR_FAILURE
            return this.close()
          }
        }
      } else {
        this.readyState = FAILED
        this.status = Cr.NS_BINDING_FAILED
        return this.close()
      }
    }
  }
  asyncOpen2(listener) {
    // throws an error if security checks fail
    var outListener = contentSecManager.performSecurityCheck(this, listener);
    return this.asyncOpen(outListener, null);
  }
  open() {
    throw Cr.NS_BASE_STREAM_WOULD_BLOCK
  }
  open2() {
    // throws an error if security checks fail
    contentSecManager.performSecurityCheck(this, null);
    return this.open();
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
  setStatus(status) {
    switch (status) {
      case Cr.NS_OK:
      case Cr.NS_BINDING_ABORTED: {
        this.readyState = CANCELED
        this.status = status
        return this
      }
      default: {
        this.readyState = FAILED
        this.status = status
        return this
      }
    }
  }
  cancel(status = Cr.NS_BINDING_ABORTED) {
    console.log('cancel')
    switch (this.readyState) {
      case ACTIVE:
      case PAUSED: {
        return void this.setStatus(status)
      }
      default: {
        throw this.status
      }
    }
  }
  suspend() {
    console.log('suspend')
    switch (this.readyState) {
      case ACTIVE: {
        this.readyState = PAUSED
        return void this
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
    console.log('resume')
    switch (this.readyState) {
      case ACTIVE: {
        return void this
      }
      case PAUSED: {
        return void this.awake()
      }
      default: {
        throw this.status
      }
    }
  }
}

class ProtocolHandler {
  //   scheme:string
  constructor(scheme, handler) {
    this.scheme = scheme
    this.defaultPort = -1
    this.protocolFlags = Ci.nsIProtocolHandler.URI_LOADABLE_BY_SUBSUMERS
  }
  handler(request) {
    return {
      contentType: 'text/plain',
      content: (async function*() {
        const encoder = new TextEncoder()
        yield encoder.encode('Hello ')
        yield encoder.encode('World!')
      })()
    }
  }
  allowPort(port, scheme) {
    return false
  }
  newURI(spec, charset, baseURI) {
    // dump(`ProtocolHandler<${this.scheme}>.newURI(${JSON.stringify(spec)}, ${JSON.stringify(charset)}, ${baseURI==null ? 'null' : baseURI.spec})\n`)
    console.log(`newURI ${spec} ${charset} ${baseURI && baseURI.spec}`)
    try {
      const url = Cc["@mozilla.org/network/standard-url-mutator;1"]
        .createInstance(Ci.nsIStandardURLMutator)
        .init(Ci.nsIStandardURL.URLTYPE_AUTHORITY,
              this.defaultPort,
              spec,
              charset,
              baseURI)
        .finalize()
        .QueryInterface(Ci.nsIURI)

      return url
    } catch(_) {
      return null
    }
  }
  newChannel(uri) {
    console.log(`newChannel ${uri.spec}`)
    return this.newChannel2(uri, null)
  }
  newChannel2(uri, loadInfo) {
    console.log(`newChannel2 ${uri.spec}`)
    // const pipe = Cc["@mozilla.org/pipe;1"].createInstance(Ci.nsIPipe)
    // pipe.init(true, true, 0, PR_UINT32_MAX, null)
    const request = new Request(uri, loadInfo)
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
    const response = this.handler(request)
    const channel = new Channel(uri, loadInfo, response)
    return channel
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
    dump(`!!! Factory.QueryInterface ${iid.name} ${iid.number}\n`)
    throw Cr.NS_ERROR_NO_INTERFACE
  }
}

const url = Components.stack.filename
const subject = `protocol@libdweb:register`

console.log(`Installed message listener "${subject}" in process ${appinfo.processID}@${appinfo.processType}`)


if (isParent) {
  console.log(`Loaded in parent process from ${url}`)
  ppmm.loadProcessScript(`data:,Cu.import('${url}');`, true)
} else {
  cpmm.addMessageListener(subject, ({data, target}) => {
    console.log(`Receive message at ${appinfo.processID}@${appinfo.processType} ${JSON.stringify(data)}`)
    const {scheme, uuid} = data
    installProtocol(scheme, uuid)
  })
  console.log(`Loaded in child process from ${url}`)
}

const {
  classes: Cc,
  interfaces: Ci,
  utils: Cu,
  results: Cr,
  manager: Cm
} = Components

const runtime = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime)

// const childProcessMessageManager = Cc[
//   "@mozilla.org/childprocessmessagemanager;1"
// ].getService(Ci.nsISyncMessageSender)

// const parentProcessMessageManager = Cc[
//   "@mozilla.org/parentprocessmessagemanager;1"
// ].getService(Ci.nsIMessageBroadcaster)

const securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(
  Ci.nsIScriptSecurityManager
)

const componentRegistrar = Cm.QueryInterface(Ci.nsIComponentRegistrar)

class ProtocolAPI {
  constructor(context) {
    this.context = context
  }
  registerProtocol(schema, handler) {
    componentRegistrar.registerFactory(
      CID("{b6c93a47-778a-f643-b0c8-79f6be685e06}"),
      `${schema} protocol handler`,
      `@mozilla.org/network/protocol;1?name=${schema}`,
      new Factory(new ProtocolHandler(handler))
    )
  }
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

class AsyncIteratorToAsyncOutputStreamCopier {
  constructor() {
    this.asyncOutputStream = asyncOutputStream
    this.asyncIterator = asyncIterator

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
    if (this.asyncIterator) {
      this.next = next
      this.onStatusUpdate()
    }
  }
  onInputError(error) {
    this.close(Cr.NS_ERROR_FAILURE)
    throw error
  }
  onStatusUpdate() {
    if (this.asyncIterator === null) {
      return void this
    } else if (this.next === null) {
      return void this
    } else if (this.next.done === true) {
      return this.close()
    } else if (this.ready === false) {
      return void this
    } else {
      return this.write(this.next.value)
    }
  }

  write(chunk) {
    this.next = null
    this.writable = false

    const output = this.binaryOutputStream || this.newBinaryOutputStream()
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
    const { asyncOutputStream } = this
    this.writable = false
    this.next = null
    this.binaryOutputStream = null
    this.asyncOutputStream = null
    this.asyncIterator = null

    asyncOutputStream.closeWithStatus(reason)
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

class ProtocolHandler {
  //   scheme:string
  constructor(scheme, handler) {
    this.scheme = scheme
    this.handler = handler
    this.defaultPort = -1
    this.protocolFlags = Ci.nsIProtocolHandler.URI_LOADABLE_BY_SUBSUMERS
  }
  allowPort(port, scheme) {
    return false
  }
  newURI(spec, charset, baseURI) {
    // dump(`ProtocolHandler<${this.scheme}>.newURI(${JSON.stringify(spec)}, ${JSON.stringify(charset)}, ${baseURI==null ? 'null' : baseURI.spec})\n`)
    const url = standardURL.init(
      Ci.nsIStandardURL.URLTYPE_STANDARD,
      this.defaultPort,
      spec,
      charset,
      baseURI
    )
    return url.clone()
  }
  newChannel(uri) {
    return this.newChannel2(uri, null)
  }
  newChannel2(uri, loadInfo) {
    const pipe = Cc["@mozilla.org/pipe;1"].createInstance(Ci.nsIPipe)
    pipe.init(true, true, 0, PR_UINT32_MAX, null)
    const response = this.handler(new Request(uri, loadInfo))

    const channel = Cc[
      "@mozilla.org/network/input-stream-channel;1"
    ].createInstance(Ci.nsIInputStreamChannel)
    channel.setURI(uri)
    channel.contentStream = pipe.inputStream
    channel.QueryInterface(Ci.nsIChannel)
    channel.contentType = response.contentType

    const copier = new AsyncIteratorToAsyncOutputStreamCopier(
      response.content,
      pipe.outputStream
    )
    copier.copy()

    return channel
  }
  QueryInterface(iid) {
    if (iid.equals(Ci.nsIProtocolHandler) || iid.equals(Ci.nsISupports)) {
      return this
    }
    dump(`!!! FSProtocolHandler.QueryInterface ${iid.name} ${iid.number}\n`)
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

this.protocol = class extends ExtensionAPI {
  getAPI(context) {
    return {
      protocol: new ProtocolAPI(context)
    }
  }
}

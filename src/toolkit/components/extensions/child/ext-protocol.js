// @flow strict

/*::
import { Cu, Cr } from "gecko"
import type { nsIMessageSender, nsresult } from "gecko"
import { ExtensionAPI, BaseContext } from "gecko"
import type { HandlerInbox, HandlerOutboxMessage, Port, ReadyState, HandlerOutbox, Inn, Out } from "../interface/protocol.js"


interface Handler {
  ({ url: string }):Response|Promise<Response>
}


interface ConnectionManager {
  disconnect(id:string):void;
}

interface Client {
  +protocol: {
    registerProtocol(string, Handler): Promise<void>
  }
}
*/

{
  const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})
  Cu.importGlobalProperties(["TextEncoder"])

  const OUTBOX = "libdweb:protocol:handler:outbox"
  const INBOX = "libdweb:protocol:handler:inbox"

  // const ACTIVE = Cr.NS_OK
  // const PAUSED = Cr.NS_BASE_STREAM_WOULD_BLOCK
  // const CLOSED = Cr.NS_BASE_STREAM_CLOSED
  // const ABORTED = Cr.NS_BINDING_ABORTED

  const IDLE = 0
  const ACTIVE = 1
  const PAUSED = 2
  const CANCELED = 3
  const CLOSED = 4
  const FAILED = 5

  class ProtocolRequest {
    /*::
    id:string
    port:Port<HandlerOutboxMessage>
    response:Promise<Response>
    statusText:string
    ok:boolean
    headers:{[string]:string}
    reader:?ReadableStreamReader
    readyState:ReadyState
    body:?RequestBodySource
    */
    constructor(
      id /*:string*/,
      port /*:Port<HandlerOutboxMessage>*/,
      response /*:Promise<Response>*/,
      body /*:?RequestBodySource*/
    ) {
      this.id = id
      this.port = port
      this.response = response
      this.reader = null
      this.readyState = IDLE
      this.body = body
    }

    // Following methods correspond to methods on nsIRequest and are
    // invoked whenever corresponding methods on nsIRequest are called.
    suspend() {
      switch (this.readyState) {
        case ACTIVE: {
          this.readyState = PAUSED
          return undefined
        }
      }
    }
    resume() {
      switch (this.readyState) {
        case IDLE:
          return this.start()
        case PAUSED:
          return this.activate()
      }
    }
    cancel(status /*:nsresult*/ = Cr.NS_OK) {
      this.readyState = CANCELED
      const { reader } = this
      if (reader) {
        reader.cancel(status === 0 ? "" : String(status))
        reader.releaseLock()
      }
    }

    // Following methods correspond to the methods of the
    // ReadableStreamDefaultController. When this request is active
    // it reads data from `response.body` and invokes methods below as necessary.
    enqueue(buffer) {
      const { id, port } = this
      port.send({
        type: "write-response-stream",
        id,
        buffer
      })
    }
    error(error) {
      switch (this.readyState) {
        case ACTIVE:
        case PAUSED: {
          this.readyState = FAILED
          const { reader, id } = this
          if (reader) {
            reader.releaseLock()
          }
          return this.port.send({
            type: "error-response-stream",
            id,
            message: error.message
          })
        }
      }
    }
    close() {
      switch (this.readyState) {
        case ACTIVE:
        case PAUSED: {
          this.readyState = CLOSED
          const { reader, id } = this
          if (reader) {
            reader.releaseLock()
          }

          this.port.send({
            type: "close-response-stream",
            id,
            reason: null
          })
        }
      }
    }

    async activate() {
      // While request is active will keep reading data from
      // response.body and sending it to the corresponding
      // agent.
      this.readyState = ACTIVE
      while (this.readyState === ACTIVE) {
        if (this.reader) {
          try {
            const { done, value } = await this.reader.read()

            const buffer =
              value == null
                ? null
                : typeof value === "string"
                  ? encoder.encode(value).buffer
                  : value.buffer

            if (buffer) {
              this.enqueue(buffer)
            }

            // If all the data has being read close response.
            if (done) {
              this.close()
            }
          } catch (error) {
            this.error(error)
          }
        }
        // If there response.body is empty close response.
        else {
          this.close()
        }
      }
    }

    async start() {
      if (this.readyState === IDLE) {
        this.readyState = ACTIVE
        const { response, id } = this
        const { status, statusText, ok, headers, body } = Cu.waiveXrays(
          await response
        )
        this.port.send({
          type: "start-response",
          id,
          status,
          statusText,
          ok,
          // @FlowIgnore
          headers: Object.fromEntries(headers)
        })

        if (body) {
          this.reader = body.getReader()
        }
        this.activate()
      }
    }

    onWrite(buffer) {
      const { body, id } = this
      console.log(`ProtocolRequest.onWrite ${id}`, body, buffer)
      if (body) {
        body.onWrite(buffer)
      }
    }
    onClose() {
      const { body, id } = this
      console.log(`ProtocolRequest.onClose ${id}`, body)
      if (body) {
        body.onClose()
      }
    }
    onError(message) {
      const { body, id } = this
      console.log(`ProtocolRequest.onError ${id}`, body, message)
      if (body) {
        body.onError(message)
      }
    }
  }

  const encoder = new TextEncoder()

  class ProtocolClient {
    /*::
    context: BaseContext
    handlers: { [string]: Handler }
    outbox: Out<HandlerOutbox>
    inbox: Inn<HandlerInbox>
    requests: {[string]: ProtocolRequest}
    */
    constructor(context /*: BaseContext */) {
      this.context = context
      this.handlers = {}
      this.requests = {}
      this.outbox = context.childManager.messageManager
      this.inbox = context.messageManager
    }
    receiveMessage({ name, data, target } /*: HandlerInbox */) {
      console.log(`Receive message Addon.Child ${name} ${JSON.stringify(data)}`)
      switch (data.type) {
        case "start-request": {
          return void this.onStartRequest(data, target)
        }
        case "suspend-request": {
          return void this.onSuspendRequest(data)
        }
        case "resume-request": {
          return void this.onResumeRequest(data)
        }
        case "cancel-request": {
          return void this.onCancelRequest(data)
        }
        case "write-request-stream": {
          return void this.onWriteRequestStream(data)
        }
        case "close-request-stream": {
          return void this.onCloseRequestStream(data)
        }
        case "error-request-stream": {
          return void this.onErrorRequestStream(data)
        }
      }
    }
    register(scheme /*: string */, handler /*: Handler */) {
      this.handlers[scheme] = handler
      console.log(`register "${scheme}" protocol handler: ${String(handler)}`)
      this.outbox.sendAsyncMessage(OUTBOX, {
        type: "register",
        scheme,
        id: this.context.extension.id
      })
    }
    unregister(scheme /*:string*/) {
      const handler = this.handlers[scheme]
      if (handler != null) {
        console.log(
          `unregister "${scheme}" protocol handler: ${String(handler)}`
        )
        this.outbox.sendAsyncMessage(OUTBOX, {
          type: "unregister",
          scheme,
          id: this.context.extension.id
        })
      }
    }
    async onStartRequest(data, outbox /*: Out<HandlerOutbox> */) {
      const {
        id,
        scheme,
        contentLength,
        url,
        method,
        headers,
        credentials,
        cache,
        redirect,
        referrer,
        integrity
      } = data
      const handler = this.handlers[scheme]

      console.log("ProtocolClient.onStartRequest", data, typeof handler)
      try {
        const source =
          contentLength === 0 ? null : new RequestBodySource(id, outbox)

        console.log(
          "ProtocolClient.onStartRequest -> new Request",
          method,
          source,
          headers,
          credentials,
          cache,
          redirect,
          referrer,
          integrity
        )

        const request = createProtocolRequest(
          this.context.cloneScope,
          url,
          source,
          {
            method,
            headers,
            credentials,
            cache,
            redirect,
            referrer,
            integrity
          }
        )

        console.log(
          `ProtocolClient.onStartRequest ${id} <- new Request `,
          request.body,
          request.gozlik
        )

        const response = new ProtocolRequest(
          id,
          this,
          Reflect.apply(handler, null, [request]),
          source
        )

        this.requests[id] = response
        console.log(`ProtocolClient.onStartRequest register ${id}`)
        response.resume()
      } catch (error) {
        const message = error.toString()

        const response = new ProtocolRequest(
          id,
          this,
          new this.context.cloneScope.Response(error, {
            ok: false,
            status: 500,
            statusText: "Extension failure"
          }),
          null
        )
        this.requests[id] = response
        response.resume()
      }
    }
    send(message) {
      this.outbox.sendAsyncMessage(OUTBOX, message)
    }
    onSuspendRequest(data) {
      const request = this.requests[data.id]
      request.suspend()
    }
    onResumeRequest(data) {
      const request = this.requests[data.id]
      request.resume()
    }
    onCancelRequest(data) {
      const request = this.requests[data.id]
      request.cancel()
    }
    onWriteRequestStream(data) {
      const request = this.requests[data.id]
      console.log("ProtocolClient.onWriteRequestStream", request, data)
      request.onWrite(data.buffer)
    }
    onCloseRequestStream(data) {
      const request = this.requests[data.id]
      console.log("ProtocolClient.onCloseRequestStream", request, data)
      request.onClose()
    }
    onErrorRequestStream(data) {
      const request = this.requests[data.id]
      console.log(
        "ProtocolClient.onErrorRequestStream",
        request,
        data,
        Object.keys(this.requests)
      )
      request.onError(data.message)
    }

    static connect(context) {
      const self = new ProtocolClient(context)
      self.inbox.addMessageListener(INBOX, self)

      return self
    }
  }

  class RequestBodySource {
    /*::
    id:string;
    outbox:Out<HandlerOutbox>;
    controller:ReadableStreamController
    type: string
    start: ReadableStreamController => ?Promise<void>
    pull: ReadableStreamController => ?Promise<void>
    cancel: string => ?Promise<void>
    */
    constructor(id /*:string*/, outbox /*:Out<HandlerOutbox>*/) {
      this.id = id
      // this.type = "bytes"
      this.outbox = outbox
    }
    start(controller) {
      this.controller = controller
    }
    pull() {
      const { id, outbox } = this
      outbox.sendAsyncMessage(OUTBOX, {
        type: "resume-request-stream",
        id
      })
    }
    cancel(reason) {
      const { id, outbox } = this
      outbox.sendAsyncMessage(OUTBOX, {
        type: "cancel-request-stream",
        id,
        reason: String(reason)
      })
    }

    suspend() {
      const { id, outbox } = this
      outbox.sendAsyncMessage(OUTBOX, {
        type: "suspend-request-stream",
        id
      })
    }
    onWrite(buffer) {
      const { controller, id, outbox } = this
      console.log(`RequestBodySource.onWrite ${id}`, controller, buffer)
      if (controller) {
        Reflect.apply(controller.enqueue, controller, [
          Cu.cloneInto(new Uint8Array(buffer), controller)
        ])
        if (controller.desiredSize <= 0) {
          this.suspend()
        }
      }
    }
    onClose() {
      const { controller, id } = this
      console.log(`RequestBodySource.onClose ${id}`, controller)
      if (controller) {
        controller.close()
      }
    }
    onError(message) {
      const { controller, id } = this
      console.log(`RequestBodySource.onError ${id}`, controller, message)
      if (controller) {
        controller.error(new Error(message))
      }
    }
  }

  const createProtocolRequest = (scope, url, source, options) => {
    const request = Cu.waiveXrays(
      Reflect.construct(scope.Request, [url, options])
    )

    if (source) {
      const stream = Reflect.construct(scope.ReadableStream, [
        Cu.cloneInto(
          {
            start(controller) {
              source.start(Cu.waiveXrays(controller))
            },
            pull(controller) {
              source.pull(Cu.waiveXrays(controller))
            },
            cancel(reason) {
              source.cancel(reason)
            }
          },
          scope,
          { cloneFunctions: true }
        )
      ])
      const response = Reflect.construct(scope.Response, [stream])
      polyfillRequest(request, response)
    }

    return request
  }

  const polyfillRequest = (request, response) => {
    Reflect.defineProperty(request, "gozlik", {
      value: "Hi Gozala"
    })
    Reflect.defineProperty(request, "bodyUsed", {
      get() {
        return response.bodyUsed
      }
    })
    Reflect.defineProperty(request, "body", {
      get() {
        return response.body
      }
    })
    Reflect.defineProperty(request, "arrayBuffer", {
      value() {
        return response.arrayBuffer()
      }
    })
    Reflect.defineProperty(request, "blob", {
      value() {
        return response.blob()
      }
    })

    Reflect.defineProperty(request, "formData", {
      value() {
        return response.formData()
      }
    })

    Reflect.defineProperty(request, "formData", {
      value() {
        return response.formData()
      }
    })

    Reflect.defineProperty(request, "json", {
      value() {
        return response.json()
      }
    })

    Reflect.defineProperty(request, "text", {
      value() {
        return response.text()
      }
    })

    Reflect.defineProperty(request, "close", {
      value() {
        return polyfillRequest(request.clone(), response.clone())
      }
    })

    return request
  }

  global.protocol = class extends ExtensionAPI /*::<Client>*/ {
    getAPI(context) {
      const init = context.childManager.callParentAsyncFunction(
        "protocol.spawn",
        []
      )

      const client = ProtocolClient.connect(context)

      return {
        protocol: {
          async registerProtocol(scheme, handler) {
            await init
            client.register(scheme, handler)
          }
        }
      }
    }
  }
}

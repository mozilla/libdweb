// @flow strict

/*::
import { Cu, Cr } from "gecko"
import type { nsIMessageSender } from "gecko"
import { ExtensionAPI, BaseContext } from "gecko"
import type { HandlerInbox, RequestStatus, HandlerOutbox, Inn, Out } from "./router"


interface Handler {
  ({ url: string }):Response|Promise<Response>
}

type Status =
  | RequestStatus
  | typeof Cr.NS_BASE_STREAM_CLOSED

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

  const ACTIVE = Cr.NS_OK
  const PAUSED = Cr.NS_BASE_STREAM_WOULD_BLOCK
  const CLOSED = Cr.NS_BASE_STREAM_CLOSED
  const ABORTED = Cr.NS_BINDING_ABORTED

  class Connection {
    /*::
    requestID:string
    port:Out<HandlerOutbox>
    reader:ReadableStreamReader
    status:Status
    */
    constructor(
      requestID /*:string*/,
      port /*:Out<HandlerOutbox>*/,
      reader /*:ReadableStreamReader*/,
      status /*:Status*/
    ) {
      this.requestID = requestID
      this.port = port
      this.reader = reader
      this.status = ACTIVE
    }
    static respond(
      requestID /*:string*/,
      port /*:Out<HandlerOutbox>*/,
      response /*:Response*/
    ) {
      const { status, statusText, ok, headers, body } = response
      const reader = body.getReader()
      const self = new Connection(requestID, port, reader, ACTIVE)
      port.sendAsyncMessage(OUTBOX, {
        type: "head",
        requestID: requestID,
        status,
        statusText,
        ok,
        headers: Object.fromEntries(headers)
      })

      return self
    }
    static error(
      requestID /*:string*/,
      port /*:Out<HandlerOutbox>*/,
      error /*:Error*/
    ) {
      port.sendAsyncMessage(OUTBOX, {
        type: "head",
        requestID,
        status: 500,
        statusText: "Handler errored",
        ok: false,
        headers: { "content-type": "text/plain;charset=utf=8" }
      })
      port.sendAsyncMessage(OUTBOX, {
        type: "body",
        requestID,
        body: { done: true, value: encoder.encode(error.message).buffer }
      })
    }
    suspend(manager /*:ConnectionManager*/) {
      if (this.status === ACTIVE) {
        this.status = PAUSED
      }
      return this
    }
    async resume(manager /*:ConnectionManager*/) {
      while (this.status === ACTIVE) {
        const { done, value } = await this.reader.read()
        const content =
          value == null
            ? null
            : typeof value === "string"
              ? encoder.encode(value).buffer
              : value.buffer

        if (this.port) {
          this.port.sendAsyncMessage(OUTBOX, {
            type: "body",
            requestID: this.requestID,
            body: { done, value: content }
          })

          if (done) {
            this.close(manager)
          }
        }
      }
    }
    close(manager) {
      this.reader.cancel(/*::""*/)
      this.reader.releaseLock()

      manager.disconnect(this.requestID)
      this.status = CLOSED
      delete this.port
    }
    abort(manager /*:ConnectionManager*/) {
      this.reader.cancel(/*::""*/)
      this.reader.releaseLock()

      this.port.sendAsyncMessage(OUTBOX, {
        type: "body",
        requestID: this.requestID,
        body: { done: true, value: null }
      })

      manager.disconnect(this.requestID)
      this.status = ABORTED
      delete this.port
    }
  }

  const encoder = new TextEncoder()

  class Protocol /*::implements ConnectionManager*/ {
    /*::
    context: BaseContext
    handlers: { [string]: Handler }
    outbox: Out<HandlerOutbox>
    inbox: Inn<HandlerInbox>
    connections: {[string]: Connection}
    */
    constructor(context /*: BaseContext */) {
      this.context = context
      this.handlers = {}
      this.connections = {}
      this.outbox = context.childManager.messageManager
      this.inbox = context.messageManager
    }
    receiveMessage({ name, data, target } /*: HandlerInbox */) {
      console.log(`Receive message Addon.Child ${name} ${JSON.stringify(data)}`)
      switch (data.type) {
        case `request`: {
          return void this.request(data, target)
        }
        case `requestUpdate`: {
          return this.updateRequest(data)
        }
      }
    }
    register(scheme /*: string */, handler /*: Handler */) {
      this.handlers[scheme] = handler
      console.log(`register "${scheme}" protocol handler: ${String(handler)}`)
      this.outbox.sendAsyncMessage(OUTBOX, {
        type: "install",
        scheme
      })
    }
    async request(request, target /*: Out<HandlerOutbox> */) {
      const { requestID, scheme, url } = request
      const handler = this.handlers[request.scheme]
      let response = null
      try {
        delete request.requestID
        const promise = Reflect.apply(handler, null, [
          Cu.cloneInto(request, handler)
        ])
        response = Cu.waiveXrays(await promise)
        const connection = Connection.respond(requestID, target, response)
        this.connect(connection)
        connection.resume(this)
      } catch (error) {
        Connection.error(requestID, target, error)
      }
    }
    connect(connection /*:Connection*/) {
      this.connections[connection.requestID] = connection
    }
    disconnect(requestID /*:string*/) {
      delete this.connections[requestID]
    }
    updateRequest(data) {
      const { requestID, status } = data
      const connection = this.connections[requestID]
      if (connection) {
        switch (status) {
          case ACTIVE: {
            return void connection.resume(this)
          }
          case PAUSED: {
            return void connection.suspend(this)
          }
          case ABORTED: {
            return void connection.abort(this)
          }
          default:
            return void this
        }
      } else {
        console.error(
          `Received update for the a closed connection ${requestID}`
        )
      }
    }

    static spawn(context) {
      const self = new Protocol(context)
      self.inbox.addMessageListener(INBOX, self)

      return self
    }
  }

  class ProtocolClient extends ExtensionAPI /*::<Client>*/ {
    getAPI(context) {
      const init = context.childManager.callParentAsyncFunction(
        "protocol.spawn",
        []
      )

      const protocol = Protocol.spawn(context)

      return {
        protocol: {
          async registerProtocol(scheme, handler) {
            await init
            protocol.register(scheme, handler)
          }
        }
      }
    }
  }
  global.protocol = ProtocolClient
}

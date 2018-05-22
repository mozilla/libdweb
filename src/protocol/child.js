// @flow

/*::
import { Cu } from "gecko"
import type { nsIMessageSender } from "gecko"
import { ExtensionAPI, BaseContext } from "gecko"
import type { HandlerInbox, HandlerOutbox, Inn, Out } from "./protocol"
*/
const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})

const OUTBOX = "libdweb:protocol:handler:outbox"
const INBOX = "libdweb:protocol:handler:inbox"

class Protocol {
  /*::
  context: BaseContext
  handlers: { [string]: Handler }
  outbox: Out<HandlerOutbox>
  inbox: Inn<HandlerInbox>
  requests: {[string]: Out<HandlerOutbox>}
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
    const response = Cu.waiveXrays(handler(Cu.cloneInto(request, handler)))
    const { content, contentType, contentCharset, contentLength } = response

    target.sendAsyncMessage(OUTBOX, {
      type: "head",
      requestID,
      contentType,
      contentCharset,
      contentLength
    })

    for await (const chunk of content) {
      target.sendAsyncMessage(OUTBOX, {
        type: "body",
        requestID,
        content: chunk
      })
    }

    target.sendAsyncMessage(OUTBOX, {
      type: "end",
      requestID
    })
  }
  updateRequest(data) {}

  static spawn(context) {
    const self = new Protocol(context)
    self.inbox.addMessageListener(INBOX, self)

    return self
  }
}

/*::
interface API {
  +protocol: {
    registerProtocol(string, Handler): Promise<void>
  };
}

interface Handler {
  ({ url: string }): {
    contentType?: string,
    contentLength?: number,
    contentCharset?: string,
    content: AsyncIterator<ArrayBuffer>
  };
}
*/
const self /*: window */ = this
self.protocol = class extends ExtensionAPI /*::<API>*/ {
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

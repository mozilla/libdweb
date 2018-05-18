const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})

class Protocol {
  static spawn(context) {
    const self = new Protocol(context)
    context.childManager.messageManager.addMessageListener(self)
    return self
  }
  constructor(context) {
    this.context = context
    this.registeredHandlers = Object.create(null)
  }
  receiveMessage({ name, data, target }) {
    switch (name) {
      case `libdweb:protocol:request`: {
        return this.request(data, target)
      }
      case `libdweb:protocol:request:update`: {
        return this.updateRequest(data)
      }
    }
  }
  register(scheme, handler) {
    this.registeredHandlers[scheme] = handler
    console.log(`registere "${scheme}" protocol handler: ${handler}`)
    this.context.childManager.messageManager.sendAsyncMessage(
      `libdweb:protocol:install`,
      {
        scheme
      }
    )
  }
  async request(request, target) {
    const { requestID, scheme, url } = request
    const handler = this.registeredHandlers[request.scheme]
    const response = handler(request)
    const { content } = request
    response.content = null
    response.requestID = requestID

    target.sendAsyncMessage(`libdweb:protocol:response`, response)

    for await (const chunk of content) {
      target.sendAsyncMessage(`libdweb:protocol:response`, {
        requestID,
        content: chunk,
        done: false
      })
    }
    target.sendAsyncMessage(`libdweb:protocol:response`, {
      requestID,
      content: chunk,
      done: true
    })
  }
  updateRequest(data) {}
}

this.protocol = class extends ExtensionAPI {
  getAPI(context) {
    const init = context.childManager.callParentAsyncFunction(
      "protocol.spawn",
      []
    )

    const protocol = new Protocol(context)

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

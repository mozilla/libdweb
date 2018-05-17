const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})

this.protocol = class extends ExtensionAPI {
  getAPI(context) {
    const init = context.childManager.callParentAsyncFunction(
      "protocol.spawn",
      []
    )

    const registeredHandlers = Object.create(null)

    return {
      protocol: {
        async registerProtocol(scheme, handler) {
          await init
          registeredHandlers[scheme] = handler
          console.log(`registere "${scheme}" protocol handler: ${handler}`)
          context.childManager.messageManager.sendAsyncMessage(
            `libdweb:protocol:install`,
            {
              scheme
            }
          )
        }
      }
    }
  }
}

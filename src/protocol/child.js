const { generateUUID } = Cc["@mozilla.org/uuid-generator;1"].getService(
  Ci.nsIUUIDGenerator
)

class Protocol {
  constructor(handler, uuid) {
    this.handler = handler
    this.uuid = uuid
  }
}

class ProtocolAPI {
  constructor(context) {
    this.context = context
    this.registeredProtocols = new Map()
  }
  async registerProtocol(scheme, handler) {
    const protocol = new Protocol(handler, generateUUID())
    this.registeredProtocols.set(scheme, protocol)
    console.log(
      "register protocol",
      scheme,
      handler.toString(),
      protocol.uuid.toString()
    )

    await this.context.childManager.callParentAsyncFunction(
      "protocol.installProtocol",
      [scheme, protocol.uuid.toString()]
    )
  }
}

this.protocol = class extends ExtensionAPI {
  getAPI(context) {
    const lib = new ProtocolAPI(context)
    return {
      protocol: {
        async registerProtocol(scheme, protocol) {
          return await lib.registerProtocol(scheme, protocol)
        }
      }
    }
  }
}

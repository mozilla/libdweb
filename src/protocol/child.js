const { ppmm, cpmm, mm } = Cu.import("resource://gre/modules/Services.jsm", {}).Services
const { generateUUID } = Cc["@mozilla.org/uuid-generator;1"]
  .getService(Ci.nsIUUIDGenerator)
Cu.importGlobalProperties(['URL'])

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

    const payload = {scheme, uuid: protocol.uuid.toString()}
    cpmm.sendAsyncMessage(`protocol@libdweb:register`, payload)
  }
}

this.protocol = class extends ExtensionAPI {
  getAPI(context) {
    const baseURL = Components.stack.filename.split(' -> ').pop()
    const url = new URL(`./common.js?now=${Date.now()}`, baseURL)
    const lib = new ProtocolAPI(context)
    // ppmm.loadProcessScript(`data:,Cu.import('${url}');`, true)
    const ready = context.childManager.callParentAsyncFunction("protocol.setup", [])

    return {
      protocol: {
        async registerProtocol(scheme, handler) {
          await ready
          return await lib.registerProtocol(scheme, handler)
        }
      }
    }
  }
}

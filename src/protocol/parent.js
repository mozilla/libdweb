const { ppmm } = Cu.import("resource://gre/modules/Services.jsm", {}).Services
Cu.importGlobalProperties(['URL'])
const url = new URL(`./common.js?now=${Date.now()}`, Components.stack.filename)
Cu.import(url, {})

this.protocol = class extends ExtensionAPI {
  getAPI(context) {
    return {
      protocol: {
        setup() {
          // registerProtocol(scheme, uuid, context)
        }
      }
    }
  }
}

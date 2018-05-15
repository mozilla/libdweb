const { ppmm } = Cu.import("resource://gre/modules/Services.jsm", {}).Services
Cu.importGlobalProperties(['URL'])
const url = new URL(`./common.js?now=${Date.now()}`, Components.stack.filename)
const { registerProtocol } = Cu.import(url, {})
console.log(`imported cross-process script ${url}`)

this.protocol = class extends ExtensionAPI {
  getAPI(context) {
    return {
      protocol: {
        installProtocol(scheme, uuid) {
          registerProtocol(scheme, uuid)
        }
      }
    }
  }
}

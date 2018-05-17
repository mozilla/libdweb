Cu.importGlobalProperties(["URL"])
const url = new URL(
  `./protocol.js?now=${Date.now()}`,
  Components.stack.filename
)
Cu.import(url, {})

this.protocol = class extends ExtensionAPI {
  getAPI(context) {
    return {
      protocol: {
        spawn() {}
      }
    }
  }
}

Cu.importGlobalProperties(["URL"])

const url = new URL(
  `./protocol.js?now=${Date.now()}`,
  Components.stack.filename
)

this.protocol = class extends ExtensionAPI {
  onStartup() {
    const { Supervisor } = Cu.import(url, {})
    this.supervisor = Supervisor.new()
  }
  onShutdown(reason) {
    if (this.supervisor) {
      this.supervisor.terminate(reason)
      delete this.supervisor
      Cu.unload(url)
    }
  }
  onManifestEntry(name) {
    console.log(`!!! onManifestEntry ${name}`)
  }
  getAPI(context) {
    return {
      protocol: {
        spawn() {}
      }
    }
  }
}

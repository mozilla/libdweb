// @flow strict
/*::
import { Cu, Cr, Components, ExtensionAPI } from "gecko"
import type { nsIMessageSender } from "gecko"
import type {Supervisor} from "../ExtensionProtocol.js"

interface Host {
  +protocol: {
    spawn():void
  }
}
*/

Cu.importGlobalProperties(["URL"])

const url = new URL(
  `../ExtensionProtocol.js?now=${Date.now()}`,
  Components.stack.filename
)

global.protocol = class extends ExtensionAPI /*::<Host>*/ {
  /*::
  supervisor:Supervisor
  */

  onManifestEntry(entryName) {
    const { extension } = this
    const { manifest } = extension
    // TODO: Figure this out
  }

  onStartup() {
    const load /*:any*/ = Cu.import
    const { Supervisor } = load(url, {})
    this.supervisor = Supervisor.new()
  }

  onShutdown(reason) {
    const { extension } = this
    const { manifest } = extension

    if (reason !== "APP_SHUTDOWN") {
      if (this.supervisor) {
        this.supervisor.terminate()
        delete this.supervisor
        Cu.unload(url.href)
      }
    }
  }

  getAPI(context) {
    return {
      protocol: {
        spawn() {}
      }
    }
  }
}

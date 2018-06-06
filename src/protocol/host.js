// @flow strict
/*::
import { Cu, Cr, Components, ExtensionAPI } from "gecko"
import type { nsIMessageSender } from "gecko"
import type {Supervisor} from "./router"

interface Host {
  +protocol: {
    spawn():void
  }
}
*/

Cu.importGlobalProperties(["URL"])

const url = new URL(`./router.js?now=${Date.now()}`, Components.stack.filename)

class ProtocolHost extends ExtensionAPI /*::<Host>*/ {
  /*::
  supervisor:Supervisor
  */
  onStartup() {
    const load /*:any*/ = Cu.import
    const { Supervisor } = load(url, {})
    this.supervisor = Supervisor.new()
  }
  onShutdown(reason) {
    if (this.supervisor) {
      this.supervisor.terminate()
      delete this.supervisor
      Cu.unload(url.href)
    }
  }
  // 123
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
global.protocol = ProtocolHost

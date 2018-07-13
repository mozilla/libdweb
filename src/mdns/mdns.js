// @flow
/*::
import { Components, Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {
  BaseContext,
  nsIDNSServiceDiscovery,
  nsIDNSServiceInfo,
  nsIDNSServiceDiscoveryListener
} from "gecko"

interface Host {
  +mdns: {};
}
*/

const mDNS = Cc[
  "@mozilla.org/toolkit/components/mdnsresponder/dns-sd;1"
].getService(Ci.nsIDNSServiceDiscovery)
// API boilerplate and hook up exports
global.mdns = class extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    return {
      mdns: {
        startDiscovery: startDiscovery
      }
    }
  }
}

/*
  let svcs = await startDiscovery('_http._tcp');
*/
async function startDiscovery(serviceType /*:string*/) {
  return new Promise((res, rej) => {
    let services = []
    mDNS.startDiscovery(
      serviceType,
      makeMDNSListener(message => {
        switch (message.type) {
          case "onServiceFound": {
            const data = message.value
            // TODO: Why are some properties of the serviceinfo not initialized?
            services.push({
              domainName: data.domainName,
              serviceName: data.serviceName,
              serviceType: data.serviceType
            })
            break
          }
          case "onDiscoveryStopped": {
            res(services)
          }
        }
      })
    )
  })
}

class Discovery {
  onDiscoveryStarted(serviceType /*:string*/) {}
  onDiscoveryStopped(serviceType /*:string*/) {}
  onServiceFound(serviceInfo /*:nsIDNSServiceInfo*/) {}
  onServiceLost(serviceInfo /*:nsIDNSServiceInfo*/) {}
  onStartDiscoveryFailed(serviceType /*:string*/, errorCode /*:number*/) {}
  onStopDiscoveryFailed(serviceType /*:string*/, errorCode /*:number*/) {}
}

function makeMDNSListener(cb) /*:nsIDNSServiceDiscoveryListener*/ {
  return {
    onDiscoveryStarted: function(a) {
      cb({ type: "onDiscoveryStarted", value: a })
    },
    onDiscoveryStopped: function(a) {
      cb({ type: "onDiscoveryStopped", value: a })
    },
    onServiceFound: function(a) {
      // TODO: Why are some properties of the serviceinfo not initialized?
      //a.QueryInterface(Ci.nsIDNSServiceInfo);
      //console.log('onServiceFound', a.get('address'));
      cb({ type: "onServiceFound", value: a })
    },
    onServiceLost: function(a) {
      cb({ type: "onServiceLost", value: a })
    },
    onStartDiscoveryFailed: function(a) {
      cb({ type: "onStartDiscoveryFailed", a })
    },
    onStopDiscoveryFailed: function(a) {
      cb({ type: "onStopDiscoveryFailed", value: a })
    }
  }
}

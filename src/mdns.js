"use strict"

const {
  classes: Cc,
  interfaces: Ci,
  utils: Cu,
  results: Cr,
  manager: Cm
} = Components

const DNS_SD_CID = "@mozilla.org/toolkit/components/mdnsresponder/dns-sd;1"

const sd = Cc[DNS_SD_CID].getService(Ci.nsIDNSServiceDiscovery)

// API boilerplate and hook up exports
this.mdns = class extends ExtensionAPI {
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
async function startDiscovery(serviceType) {
  return new Promise((res, rej) => {
    let services = []
    sd.startDiscovery(
      serviceType,
      makeMDNSListener((eventName, data) => {
        if (eventName == "onServiceFound") {
          // TODO: Why are some properties of the serviceinfo not initialized?
          services.push({
            domainName: data.domainName,
            serviceName: data.serviceName,
            serviceType: data.serviceType
          })
        } else if (eventName == "onDiscoveryStopped") {
          res(services)
        }
      })
    )
  })
}

function makeMDNSListener(cb) {
  return {
    onDiscoveryStarted: function(a) {
      cb("onDiscoveryStarted", a)
    },
    onDiscoveryStopped: function(a) {
      cb("onDiscoveryStopped", a)
    },
    onServiceFound: function(a) {
      // TODO: Why are some properties of the serviceinfo not initialized?
      //a.QueryInterface(Ci.nsIDNSServiceInfo);
      //console.log('onServiceFound', a.get('address'));
      cb("onServiceFound", a)
    },
    onServiceLost: function(a) {
      cb("onServiceLost", a)
    },
    onStartDiscoveryFailed: function(a) {
      cb("onStartDiscoveryFailed", a)
    },
    onStopDiscoveryFailed: function(a) {
      cb("onStopDiscoveryFailed", a)
    }
  }
}

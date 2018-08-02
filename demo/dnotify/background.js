// listen for services
void (async () => {
  const services = browser.ServiceDiscovery.discover({
    type: "http",
    protocol: "tcp"
  })

  console.log("Start discovery")
  for await (const service of services) {
    if (service.lost) {
      console.log("Lost service", service)
    } else {
      console.log("Found service", {
        name: service.name,
        type: service.type,
        protocol: service.protocol
      })

      if (service.attributes["url"]) {
        console.log("service attrs", service.attributes["url"])
        browser.notifications.create(service.attributes["url"], {
          type: "basic",
          iconUrl: browser.extension.getURL("icons/link-48.png"),
          title: service.name,
          message: service.attributes["url"]
        })
      }
    }
  }
  console.log("End discovery")
})()

// publish service
void (async () => {
  const service = await browser.ServiceDiscovery.announce({
    name: "test service!",
    type: "http",
    protocol: "tcp", // must be "tcp" or "udp"
    port: 3000, // omitting port will just assign you available one.
    attributes: {
      // optional txt records
      version: "1.0.",
      url: "http://10.30.65.170/dnotify"
    }
  })

  console.log("Service annouced", {
    name: service.name, // Note: Colud be different like "My dweb service (2)"
    type: service.type,
    protocol: service.protocol,
    port: service.port,
    attributes: service.attributes // Will be null if was omitted
  })

  /*
  // Wait for a 1 minute and expire service announcement
  await new Promise(timeout => setTimeout(timeout, 60 * 1000))
  await service.expire()
  console.log(`Service expired`)
  */
})()

// listen for notification clicks
browser.notifications.onClicked.addListener(async function(url) {
  await browser.tabs.create({ url: url })
  /*
  let all = await browser.notifications.getAll();
  console.log('notifications', all)
  for (let id in all) {
    console.log('id', id)
    if (id == notificationId) {
      console.log('YES')
      tabs.create({ url: all[id].content});
    }
  }
  */
})

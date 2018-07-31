void (async () => {
  const services = browser.ServiceDiscovery.discover({
    type: "dweb",
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

      /*
      for (const {
        address,
        port,
        host,
        attributes
      } of await service.addresses()) {
        console.log(
          `Service ${service.name} available at ${host} ${address}:${port}`,
          attributes
        )
      }
      */
    }
  }
  console.log("End discovery")
})()

void (async () => {
  const service = await browser.ServiceDiscovery.announce({
    name: "My dweb service",
    type: "dweb",
    protocol: "tcp", // must be "tcp" or "udp"
    port: 3000, // omitting port will just assign you available one.
    attributes: {
      // optional txt records
      version: "1.0."
    }
  })

  console.log("Service annouced", {
    name: service.name, // Note: Colud be different like "My dweb service (2)"
    type: service.type,
    protocol: service.protocol,
    port: service.port,
    attributes: service.attributes // Will be null if was omitted
  })

  // Wait for a 1 minute and expire service announcement
  await new Promise(timeout => setTimeout(timeout, 60 * 1000))
  await service.expire()
  console.log(`Service expired`)
})()

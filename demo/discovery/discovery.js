const main = async () => {
  const services = await browser.ServiceDiscovery.discover({
    type: "http",
    protocol: "tcp"
  })

  const state = {}
  for await (const service of services) {
    const id = `${service.name}._${service.type}._${service.protocol}`

    if (service.lost) {
      delete state[id]
      render(state)
    } else {
      const record = { service, addresses: {} }
      state[id] = record

      render(state)

      /*
      const addresses = await service.addresses()
      for (const { address, port, host, attributes } of addresses) {
        record.addresses[address] = { address, host, port, attributes }
      }
      render(state)
      */
    }
  }
}

void (async () => {
  const service = await browser.ServiceDiscovery.announce({
    name: "My dweb service",
    type: "http",
    protocol: "tcp", // must be "tcp" or "udp"
    port: 3000, // omitting port will just assign you available one.
    attributes: {
      // optional txt records
      version: "1.0."
    }
  })

  console.log("Service annouced", {
    name: service.name, // Note: Could be different like "My dweb service (2)"
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

const render = state => {
  document.querySelector(".loader").style.display = "none"
  document.querySelector(".services").textContent = JSON.stringify(
    state,
    null,
    2
  )
}

main()

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

      const addresses = await service.addresses()
      for (const { address, port, host, attributes } of addresses) {
        record.addresses[address] = { address, host, port, attributes }
      }
      render(state)
    }
  }
}

const render = state => {
  document.querySelector(".loader").style.display = "none"
  document.querySelector(".services").textContent = JSON.stringify(
    state,
    null,
    2
  )
}

main()

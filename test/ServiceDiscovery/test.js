// @noflow

const { test } = browser.test

test("ServiceDiscovery", test => {
  const { ServiceDiscovery } = browser
  test.equal(
    typeof ServiceDiscovery,
    "object",
    "ServiceDiscovery API available"
  )

  test.equal(
    typeof ServiceDiscovery.announce,
    "function",
    "has ServiceDiscovery.announce"
  )

  test.equal(
    typeof ServiceDiscovery.discover,
    "function",
    "has ServiceDiscovery.discover"
  )
})

test("discovery", async test => {
  const [type, protocol, name, port] = [
    `dweb1`,
    `tcp`,
    `name ${Date.now().toString(32)}`,
    3000
  ]
  const services = browser.ServiceDiscovery.discover({
    type,
    protocol
  })

  test.deepEqual(
    services.query,
    {
      type,
      protocol
    },
    "ServiceDiscovery.discover(query).query is query passed"
  )

  const discover = async () => {
    for await (const service of services) {
      test.equal(service.lost, false, "found service")
      test.equal(service.name, name, "service.name matches announcement")
      test.equal(service.type, type, "service.type matches announcement")
      test.equal(service.domain, "local", "service.domain matches announcement")
      test.equal(
        service.protocol,
        protocol,
        "service.protocol matches announcement"
      )
      test.equal(
        typeof service.addresses,
        "function",
        "has service.addressses()"
      )

      return await service.addresses()
    }
  }

  const announce = async () => {
    return await browser.ServiceDiscovery.announce({
      name,
      type,
      protocol,
      port
    })
  }

  const discovery = discover()
  const announcement = announce()

  const service = await announcement
  test.equal(service.name, name, "service.name matches announcement")
  test.equal(service.type, type, "service.type matches announcement")
  test.equal(service.domain, "local", "service.domain is local")
  test.equal(service.port, port, "service.port matches announcement")
  test.equal(
    service.protocol,
    protocol,
    "service.protocol matches announcement"
  )
  test.deepEqual(
    service.attributes,
    {},
    "service.attributes matches announcement"
  )

  const addresses = await discovery
  test.ok(Array.isArray(addresses), "resolves to array")
  test.ok(addresses.length > 0, "addresses isn't empty")

  for (const address of addresses) {
    test.equal(typeof address.host, "string", "has address.host")
    test.equal(typeof address.address, "string", "has address.address")
    test.equal(address.port, port, "address.port matches announcement")
    test.deepEqual(address.attributes, {}, "address.attributes is empty")
  }
})

test("discovery with attributes", async test => {
  const [type, protocol, name] = [
    `dweb2`,
    `udp`,
    `name ${Date.now().toString(32)}`
  ]
  const services = browser.ServiceDiscovery.discover({
    type,
    protocol
  })

  test.deepEqual(
    services.query,
    {
      type,
      protocol
    },
    "ServiceDiscovery.discover(query).query is query passed"
  )

  const discover = async () => {
    for await (const service of services) {
      test.equal(service.lost, false, "found service")
      test.equal(service.name, name, "service.name matches announcement")
      test.equal(service.type, type, "service.type matches announcement")
      test.equal(service.domain, "local", "service.domain matches announcement")
      test.equal(
        service.protocol,
        protocol,
        "service.protocol matches announcement"
      )
      test.equal(
        typeof service.addresses,
        "function",
        "has service.addressses()"
      )

      return await service.addresses()
    }
  }

  const announce = async () => {
    return await browser.ServiceDiscovery.announce({
      name,
      type,
      protocol,
      attributes: {
        version: "1.0"
      }
    })
  }

  const discovery = discover()
  const announcement = announce()

  const service = await announcement
  test.equal(service.name, name, "service.name matches announcement")
  test.equal(service.type, type, "service.type matches announcement")
  test.equal(service.domain, "local", "service.domain is local")
  test.equal(typeof service.port, "number", "service.port was assigned")
  test.equal(
    service.protocol,
    protocol,
    "service.protocol matches announcement"
  )
  test.deepEqual(
    service.attributes,
    { version: "1.0" },
    "service.attributes matches announcement"
  )

  const addresses = await discovery
  test.ok(Array.isArray(addresses), "resolves to array")
  test.ok(addresses.length > 0, "addresses isn't empty")

  for (const address of addresses) {
    test.equal(typeof address.host, "string", "has address.host")
    test.equal(typeof address.address, "string", "has address.address")
    test.equal(
      typeof address.port,
      "number",
      "address.port matches announcement"
    )
    test.deepEqual(
      address.attributes,
      { version: "1.0" },
      "address.attributes is empty"
    )
  }
})

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
        typeof service.host,
        "string",
        `service.host is string ${service.host}`
      )
      test.equal(
        service.port,
        port,
        `service.port matches announcement ${service.port}`
      )
      test.deepEqual(service.attributes, {}, "service.attributes is empty")
      test.ok(Array.isArray(service.addresses), "service.addresses is an array")
      test.ok(service.addresses.length > 0, "service.addresses isn't empty")

      for (const address of service.addresses) {
        test.equal(typeof address, "string", `address is string ${address}`)
      }

      break
    }
  }

  const announce = async () => {
    const service = await browser.ServiceDiscovery.announce({
      name,
      type,
      protocol,
      port
    })

    test.pass(`Service.announced`)

    test.equal(service.name, name, "service.name matches announcement")
    test.equal(service.type, type, "service.type matches announcement")
    test.equal(service.domain, "local", "service.domain is local")
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

    test.equal(
      typeof service.host,
      "string",
      `service.host is string ${service.host}`
    )
    test.equal(service.port, port, "service.port matches announcement")
    test.deepEqual(service.attributes, {}, "address.attributes is empty")
    test.ok(Array.isArray(service.addresses), "service.addresses is array")
    test.ok(service.addresses.length > 0, "service.addresses isn't empty")

    for (const address of service.addresses) {
      test.equal(typeof address, "string", `address is string ${address}`)
    }
  }

  const discovery = discover()
  const announcement = announce()

  await announcement
  await discovery
})

test("discovery with attributes", async test => {
  const [type, protocol, name, attributes] = [
    `dweb2`,
    `udp`,
    `name ${Date.now().toString(32)}`,
    {
      version: "1"
    }
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
      test.pass(`Service discovered`)
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
        typeof service.host,
        "string",
        `service.host is string ${service.host}`
      )
      test.equal(
        typeof service.port,
        "number",
        `service.port is number ${service.port}`
      )
      test.deepEqual(
        service.attributes,
        attributes,
        "service.attributes matches announcement"
      )
      test.ok(Array.isArray(service.addresses), "service.addresses is array")
      test.ok(service.addresses.length > 0, "service.addresses isn't empty")

      for (const address of service.addresses) {
        test.equal(typeof address, "string", `address is string ${address}`)
      }

      break
    }
  }

  const announce = async () => {
    const service = await browser.ServiceDiscovery.announce({
      name,
      type,
      protocol,
      attributes
    })

    test.equal(service.name, name, "service.name matches announcement")
    test.equal(service.type, type, "service.type matches announcement")
    test.equal(service.domain, "local", "service.domain is local")
    test.equal(
      service.protocol,
      protocol,
      "service.protocol matches announcement"
    )
    test.equal(
      typeof service.host,
      "string",
      `service.host is string ${service.host}`
    )
    test.equal(
      typeof service.port,
      "number",
      `service.port is number ${service.port}`
    )
    test.deepEqual(
      service.attributes,
      attributes,
      "service.attributes matches announcement"
    )

    test.ok(Array.isArray(service.addresses), "service.addresses is array")
    test.ok(service.addresses.length > 0, "service.addresses isn't empty")

    for (const address of service.addresses) {
      test.equal(typeof address, "string", `address is string ${address}`)
    }
  }

  const discovery = discover()
  const announcement = announce()

  await announcement
  await discovery
})

test("unwrappable exceptions #67", async test => {
  try {
    const service = await browser.ServiceDiscovery.announce({
      name: "error",
      type: "boom",
      protocol: "crash"
    })
    test.fail(`Exception was expected on wrong protocol`)
  } catch (error) {
    test.ok(
      error.message.includes(`must be either "udp" or "tcp"`),
      "error is unwrappable"
    )
  }
})

// @noflow

const { test } = browser.test
const { UDPSocket } = browser

test("API", test => {
  test.equal(typeof UDPSocket, "object", "UDPSocket API available")
  test.notEqual(
    typeof UDPSocket.FAMILY_INET,
    "undefined",
    "FAMILY_INET is defined"
  )

  test.notEqual(
    typeof UDPSocket.FAMILY_INET6,
    "undefined",
    "FAMILY_INET6 is defined"
  )

  test.notEqual(
    typeof UDPSocket.FAMILY_LOCAL,
    "undefined",
    "FAMILY_LOCAL is defined"
  )

  test.equal(
    typeof UDPSocket.create,
    "function",
    "UDPSocket.create is a function"
  )
})

const family = new Set([
  UDPSocket.FAMILY_INET,
  UDPSocket.FAMILY_INET6,
  UDPSocket.FAMILY_LOCAL
])

test("message exchange", async test => {
  const { UDPSocket } = browser
  const port = 41234
  const host = "127.0.0.1"
  const message = "Hello UDP"

  const serve = async () => {
    const server = await UDPSocket.create({ port })
    const { address } = server
    test.equal(typeof address, "object", `server.address is ${address}`)
    test.equal(address.port, port, `address.port is ${port}`)
    test.equal(
      typeof address.address,
      "string",
      `server.address.address is ${address.address}`
    )
    test.ok(family.has(address.family), `address.family is ${address.family}`)

    const decoder = new TextDecoder()
    for await (const [data, from] of server.messages()) {
      test.equal(typeof from, "object", "message has address")
      test.equal(typeof from.port, "number", `client port is ${from.port}`)
      test.equal(
        typeof from.address,
        "string",
        `client address is ${from.address}`
      )
      test.ok(family.has(from.family), `client family is ${from.family}`)

      test.ok(data instanceof ArrayBuffer, "message has ArrayBuffer data")

      test.equal(decoder.decode(data), message, `received message ${message}`)
      break
    }
    test.pass("stopped receiving messages")
    return server
  }

  const consume = async () => {
    const socket = await UDPSocket.create()

    const { address } = socket
    test.equal(typeof address, "object", `socket address is ${address}`)
    test.equal(typeof address.port, "number", `socket port is ${address.port}`)
    test.equal(
      typeof address.address,
      "string",
      `socket address is ${address.address}`
    )
    test.ok(family.has(address.family), `socket family is ${address.family}`)

    console.log("TextEncoder")

    const encoder = new TextEncoder()
    const data = encoder.encode(message).buffer
    await socket.send(host, port, data)
    test.pass("socket send a message")
    return socket
  }

  const $server = serve()
  const $client = consume()

  const server = await $server
  const client = await $client

  await server.close()
  test.pass("closed server socket")
  await client.close()
  test.pass("closed client socket")
})

var encoder = new TextEncoder()
var decoder = new TextDecoder()

var serve = async context => {
  const server = await browser.TCPSocket.listen({ port: 8090 })
  context.server = server
  console.log("Server:", server)

  async function listen(server) {
    for await (const client of server.connections) {
      console.log("Connection:", client)
      context.connection = client
      const message = await client.read()
      console.log("Received message:", decoder.decode(message))
      await client.write(
        encoder.encode(`<echo>${decoder.decode(message)}</echo>`).buffer
      )
    }
    console.log("Server is stopped", server)
  }

  await listen(server)
  return server
}

var consume = async context => {
  const client = await browser.TCPSocket.connect({
    host: "localhost",
    port: 8090
  })
  context.client = client
  await client.opened
  console.log("Client connected:", client)

  await client.write(encoder.encode("Hello TCP").buffer)
  const response = await client.read()
  console.log("Received response:", decoder.decode(response))
  return client
}

serve(window)
consume(window)

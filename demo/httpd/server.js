/**
 * This demo is inspired by and adapted from:
 * https://www.codementor.io/ziad-saab/let-s-code-a-web-server-from-scratch-with-nodejs-streams-h4uc9utji
 */
var encoder = new TextEncoder()
var decoder = new TextDecoder()

var serve = async context => {
  const server = await browser.TCPSocket.listen({ port: 3000 })
  context.server = server
  console.log("Server:", server)

  async function listen(server) {
    for await (const client of server.connections) {
      console.log("Connection:", client)
      context.connection = client
      const message = await client.read()
      const decodedMessage = decoder.decode(message)
      console.log("Received request:", decodedMessage)

      const marker = decodedMessage.indexOf("\r\n\r\n")
      if (marker !== -1) {
        const reqHeader = decodedMessage.slice(0, marker).toString()
        const body = decodedMessage.slice(marker + 4).toString()
        const reqHeaders = reqHeader.split("\r\n")
        const reqLine = reqHeaders.shift().split(" ")
        const headers = reqHeaders.reduce((acc, currentHeader) => {
          const [key, value] = currentHeader.split(":")
          return {
            ...acc,
            [key.trim().toLowerCase()]: value.trim()
          }
        }, {})
        // This object will be sent to the handleRequest callback.
        const request = {
          method: reqLine[0],
          url: reqLine[1],
          httpVersion: reqLine[2].split("/")[1],
          headers,
          body
        }

        console.dir("request", request)
      }

      await client.write(
        encoder.encode(
          `HTTP/1.1 200 OK\r\nServer: Firefox, yeah, really\r\nContent-Length: 0\r\n\r\n`
        ).buffer
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
// consume(window)

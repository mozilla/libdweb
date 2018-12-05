/**
 * This demo is inspired by and adapted from:
 * https://www.codementor.io/ziad-saab/let-s-code-a-web-server-from-scratch-with-nodejs-streams-h4uc9utji
 */
var encoder = new TextEncoder()
var decoder = new TextDecoder()

var createWebServer = async (port, requestHandler) => {
  async function listen() {
    const server = await browser.TCPSocket.listen({ port: port })

    for await (const client of server.connections) {
      const message = await client.read()
      const decodedMessage = decoder.decode(message)
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

        const request = {
          method: reqLine[0],
          url: reqLine[1],
          httpVersion: reqLine[2].split("/")[1],
          headers,
          body
        }

        console.dir("request", request)

        let status = 200,
          statusText = "OK",
          headersSent = false
        const responseHeaders = {
          server: "Firefox, yeah, really"
        }

        function setHeader(key, value) {
          responseHeaders[key.toLowerCase()] = value
        }

        async function write(chunk) {
          await client.write(encoder.encode(chunk).buffer)
        }

        function sendHeaders() {
          headersSent = true
          setHeader("date", new Date().toGMTString())
          write(`HTTP/1.1 ${status} ${statusText}\r\n`)
          Object.keys(responseHeaders).forEach(headerKey => {
            write(`${headerKey}: ${responseHeaders[headerKey]}\r\n`)
          })
          write("\r\n")
        }

        function send(body) {
          if (!headersSent) {
            if (!responseHeaders["content-length"]) {
              setHeader("content-length", body ? body.length : 0)
            }
            sendHeaders()
          }
          write(body)
        }

        const response = {
          setHeader,
          end,
          setStatus(newStatus, newStatusText) {
            ;(status = newStatus), (statusText = newStatusText)
          }
        }

        requestHandler(request, response)
      }
    }
  }
  await listen(port)
}

const webServer = createWebServer(3000, (req, res) => {
  // This is the as our original code with the http module :)
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  res.setHeader("Content-Type", "text/plain")
  res.send("Hello World!")
})

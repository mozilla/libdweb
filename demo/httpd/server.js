/**
 * This demo is inspired by and adapted from:
 * https://www.codementor.io/ziad-saab/let-s-code-a-web-server-from-scratch-with-nodejs-streams-h4uc9utji
 */
var encoder = new TextEncoder()
var decoder = new TextDecoder()
var mimes = {
  html: "text/html",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg"
}

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
          send,
          close: async () => await client.close(),
          setStatus(newStatus, newStatusText) {
            ;(status = newStatus), (statusText = newStatusText)
          }
        }

        await requestHandler(request, response)
      }
    }
  }
  await listen(port)
}

var mountFolder = async () => {
  const url = localStorage.getItem("volumeURL")
  const volume = await browser.FileSystem.mount({ url, read: true })
  localStorage.setItem("volumeURL", volume.url)

  const dir = await browser.FileSystem.readDirectory(volume.url)
  console.log("dir", dir)
}

document.getElementById("select-folder").addEventListener("click", ev => {
  console.log("trying to mount folder")
  mountFolder()

  createWebServer(3000, async (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
    const url = localStorage.getItem("volumeURL")
    const volume = await browser.FileSystem.mount({ url, read: true })
    localStorage.setItem("volumeURL", volume.url)
    const dir = await browser.FileSystem.readDirectory(volume.url)

    if (req.url == "/" || req.url == "") {
      req.url = "/index.html"
    }
    const fileURL = new URL(req.url.slice(1), volume.url).href
    const exists = await browser.FileSystem.exists(fileURL)

    if (exists) {
      const file = await browser.FileSystem.open(fileURL, { read: true })
      const chunk = await browser.File.read(file)
      const content = decoder.decode(chunk)
      const ext = req.url.split(".").pop()
      res.setHeader(
        "Content-Type",
        mimes.hasOwnProperty(ext) ? mimes[ext] : "unknown"
      )
      res.send(content)
    } else {
      res.setStatus(404)
      res.send("File not found")
    }
  })
})

browser.protocol.registerProtocol("dweb", request => {
  examples = ["stream", "async", "crash", "text", "html"]
  switch (request.url) {
    case "dweb://stream/": {
      return {
        contentType: "text/html",
        content: (async function*() {
          const encoder = new TextEncoder("utf-8")
          yield encoder.encode("<h1>Say Hi to endless stream!</h1>\n").buffer
          let n = 0
          while (true) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            yield encoder.encode(`<p>Chunk #${++n}<p>`).buffer
          }
        })()
      }
    }
    case "dweb://async/": {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 100, {
          contentType: "text/plain",
          content: (async function*() {
            const encoder = new TextEncoder("utf-8")
            yield encoder.encode("Async response yo!").buffer
          })()
        })
      })
    }
    case "dweb://crash/": {
      throw Error("Boom!")
    }
    case "dweb://text/": {
      return {
        content: (async function*() {
          const encoder = new TextEncoder("utf-8")
          yield encoder.encode("Just a plain text").buffer
        })()
      }
    }
    case "dweb://html/": {
      return {
        content: (async function*() {
          const encoder = new TextEncoder("utf-8")
          yield encoder.encode("<h1>HTML</h1>").buffer
          yield encoder.encode("<p>ContentType was inferred as HTML").buffer
        })()
      }
    }
    default: {
      return {
        contentType: "text/html",
        content: (async function*() {
          const encoder = new TextEncoder("utf-8")
          yield encoder.encode("<h1>Hi there!</h1>\n").buffer
          yield encoder.encode(
            `<p>You've succesfully loaded <strong>${request.url}</strong><p>
            ${examples
              .map(ex => `<a href=\"dweb://${ex}/\" >${ex}</a>`)
              .join("<br>")}`
          ).buffer
        })()
      }
    }
  }
})

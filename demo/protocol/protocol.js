browser.protocol.registerProtocol("dweb", request => {
  examples = ["stream", "async", "crash", "text", "html"]
  switch (request.url) {
    case "dweb://stream/": {
      let cancelled = false
      const body = new ReadableStream({
        async start(controller) {
          controller.enqueue("<h1>Say Hi to endless stream!</h1>\n")
          let n = 0
          while (!cancelled && n < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            controller.enqueue(`<p>Chunk #${++n}<p>`)
          }
          controller.close()
        },
        cancel() {
          cancelled = true
        }
      })
      return new Response(body, {
        headers: { "content-type": "text/html;charset=utf-8" }
      })
    }
    case "dweb://async/": {
      return new Promise((resolve, reject) => {
        setTimeout(
          resolve,
          100,
          new Response("Async response yo!", {
            headers: {
              "content-type": "text/plain"
            }
          })
        )
      })
    }
    case "dweb://crash/": {
      throw Error("Boom!")
    }
    case "dweb://text/": {
      return new Response("Just a plain text")
    }
    case "dweb://html/": {
      const blob = new Blob([
        "<h1>HTML</h1>",
        "<p>ContentType was inferred as HTML"
      ])
      return new Response(blob)
    }
    default: {
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue("<h1>Hi there!</h1>\n")
          controller.enqueue(`<p>You've succesfully loaded <strong>${
            request.url
          }</strong><p>
          ${examples
            .map(ex => `<a href=\"dweb://${ex}/\" >${ex}</a>`)
            .join("<br>")}`)
          controller.close()
        }
      })

      return new Response(body, {
        headers: {
          "content-type": "text/html"
        }
      })
    }
  }
})

console.log("Hi there", browser.experiments.protocol)

debugger
browser.experiments.protocol.registerProtocol("goz", request => {
  return {
    contentType: "text/html",
    content: async function*() {
      const encoder = new TextEncoder("utf-8")
      yield encoder.encode("hello")
      yield encoder.encode("world")
    }
  }
})

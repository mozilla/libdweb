console.log("Hi there", browser.protocol)

debugger
browser.protocol.registerProtocol("goz", request => {
  return {
    contentType: "text/html",
    content: async function*() {
      const encoder = new TextEncoder("utf-8")
      yield encoder.encode("hello").buffer
      yield encoder.encode("world").buffer
    }
  }
})

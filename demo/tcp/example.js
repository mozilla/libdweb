var wait = promise => (
  promise.then(ok => (promise.ok = ok), error => (promise.error = error)),
  promise
)

var server = wait(browser.TCPServerSocket.listen({ port: 8090 }))

var serverStop = wait(server.ok.close())

conns = server.ok.connections()
conn = conns.next()

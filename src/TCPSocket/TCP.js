{
  var EXPORTED_SYMBOLS = ["newTCPSocket", "newTCPServerSocket", "mozTCPSocket"]

  this.newTCPServerSocket = (port, options, backlog) =>
    new TCPServerSocket(port, options, backlog)

  this.newTCPSocket = (host, port, options) => new TCPSocket(host, port, options)

}
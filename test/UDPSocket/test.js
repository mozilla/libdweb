// @noflow

const { test } = browser.test
const { UDPSocket } = browser

test("API", test => {
  test.equal(typeof UDPSocket, "object", "UDPSocket API available")
  test.equal(
    typeof UDPSocket.create,
    "function",
    "UDPSocket.listen is a function"
  )
  test.equal(
    typeof UDPSocket.close,
    "function",
    "UDPSocket.close is a function"
  )
  test.equal(typeof UDPSocket.send, "function", "UDPSocket.send is a function")
  test.equal(
    typeof UDPSocket.messages,
    "function",
    "UDPSocket.messages is a function"
  )
  test.equal(
    typeof UDPSocket.setMulticastLoopback,
    "function",
    "UDPSocket.setMulticastLoopback is a function"
  )
  test.equal(
    typeof UDPSocket.setMulticastInterface,
    "function",
    "UDPSocket.setMulticastInterface is a function"
  )
  test.equal(
    typeof UDPSocket.addMembership,
    "function",
    "UDPSocket.addMembership is a function"
  )
  test.equal(
    typeof UDPSocket.dropMembership,
    "function",
    "UDPSocket.dropMembership is a function"
  )
})

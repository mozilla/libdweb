// @noflow

const { test } = browser.test

test("protocol", test => {
  const { protocol } = browser
  test.equal(typeof protocol, "object", "protocol API available")
  test.equal(
    typeof protocol.registerProtocol,
    "function",
    "has protocol.registerProtocol"
  )
})

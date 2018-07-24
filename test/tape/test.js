const test =
  typeof browser === "undefined" ? require("tape") : browser.test.test

test("Something", t => {
  t.ok(1 === 1)
  t.end()
})

test("deepEqual", t => {
  t.deepEqual({ a: 1 }, { a: 1 }, "objects are deepEqual")
  t.end()
})

test("deepEqual error", t => {
  t.deepEqual({ a: 1 }, { a: 1, b: 2 }, "objects are deepEqual")
  t.end()
})

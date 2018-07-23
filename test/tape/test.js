import test from "./tape.js"

test("Something", t => {
  t.ok(1 === 1)
  t.end()
})

test("deepEqual", t => {
  t.deepEqual({ a: 1 }, { a: 1 }, "objects are deepEqual")
  t.end()
})

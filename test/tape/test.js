console.log("Hello world")

const { test } = browser.test

test("Something", t => {
  t.ok(1 === 1)
  t.end()
})

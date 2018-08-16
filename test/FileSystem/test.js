// @noflow

const { test } = browser.test

test("FileSystem", test => {
  const { FileSystem } = browser
  test.equal(typeof FileSystem, "object", "has FileSystem")
  test.equal(typeof FileSystem.mount, "function", "has FileSystem.mount")
  test.equal(typeof FileSystem.open, "function", "has FileSystem.open")
  test.equal(typeof FileSystem.readFile, "function", "has FileSystem.readFile")
  test.equal(
    typeof FileSystem.writeFile,
    "function",
    "has FileSystem.writeFile"
  )
  test.equal(
    typeof FileSystem.removeFile,
    "function",
    "has FileSystem.removeFile"
  )
  test.equal(typeof FileSystem.setDates, "function", "has FileSystem.setDates")
  test.equal(
    typeof FileSystem.setPermissions,
    "function",
    "has FileSystem.setPermissions"
  )
  test.equal(typeof FileSystem.stat, "function", "has FileSystem.stat")
  test.equal(typeof FileSystem.copy, "function", "has FileSystem.copy")
  test.equal(typeof FileSystem.move, "function", "has FileSystem.move")
  test.equal(
    typeof FileSystem.createSymbolicLink,
    "function",
    "has FileSystem.createSymbolicLink"
  )
  test.equal(typeof FileSystem.exists, "function", "has FileSystem.exists")
  test.equal(typeof FileSystem.watch, "function", "has FileSystem.watch")
  test.equal(
    typeof FileSystem.createDirectory,
    "function",
    "has FileSystem.createDirectory"
  )
  test.equal(
    typeof FileSystem.removeDirectory,
    "function",
    "has FileSystem.removeDirectory"
  )
  test.equal(
    typeof FileSystem.readDirectory,
    "function",
    "has FileSystem.readDirectory"
  )
})

test("FileSystem methods", test => {
  const { File } = browser
  test.equal(typeof File, "object", "File API available")

  test.equal(typeof File.close, "function", "has File.close")
  test.equal(typeof File.flush, "function", "has File.flush")

  test.equal(typeof File.getPosition, "function", "has File.getPosition")
  test.equal(typeof File.stat, "function", "has File.stat")
  test.equal(typeof File.setDates, "function", "has File.setDates")
  test.equal(typeof File.read, "function", "has File.read")
  test.equal(typeof File.write, "function", "has File.write")
})

/* @flow */

import * as libdweb from "../"
import test from "blue-tape"

test("test baisc", async test => {
  test.isEqual(typeof(libdweb), "object")
})

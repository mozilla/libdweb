// @flow
/*::
import { Cu, Cr } from "gecko"
import type { nsIMessageSender } from "gecko"
import { ExtensionAPI, BaseContext } from "gecko"

type ComparisonOperator =
  | "equal"
  | "notEqual"
  | "deepEqual"
  | "notDeepEqual"
  | "deepLooseEqual"
  | "notDeepLooseEqual"

type Report =
  | { type: "start" }
  | { type: "end" }
  | { type: "finish" }
  | { type: "comment", message:string }
  | { type: "fail", message:string }
  | { type: "pass", message:string }
  | { type: "skip", message:string }
  | { type: "error", error:mixed }
  | { type: "ok", isOk: boolean, message:string, value:mixed }
  | { type: "match", isOk:boolean, message:string, value:mixed, matcher: RegExp | Function }
  | { type: "throws", isOk:boolean, message:string }
  | { type: "doesNotThrow", isOk:boolean, message:string }
  | { type: "compare", isOk: boolean, operator:ComparisonOperator, message:string, expect:mixed, actual:mixed }
*/

{
  const { ExtensionUtils } = Cu.import(
    "resource://gre/modules/ExtensionUtils.jsm",
    {}
  )
  const { ExtensionError, getUniqueId } = ExtensionUtils

  const { setTimeout, clearTimeout } = Cu.import(
    "resource://gre/modules/Timer.jsm",
    {}
  )

  const deepEqual = (actual, expected, opts = noOpts) => {
    // 7.1. All identical values are equivalent, as determined by ===.
    if (actual === expected) {
      return true
    } else if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime()

      // 7.3. Other pairs that do not both pass typeof value == 'object',
      // equivalence is determined by ==.
    } else if (
      !actual ||
      !expected ||
      (typeof actual != "object" && typeof expected != "object")
    ) {
      return opts.strict ? actual === expected : actual == expected

      // 7.4. For all other Object pairs, including Array objects, equivalence is
      // determined by having the same number of owned properties (as verified
      // with Object.prototype.hasOwnProperty.call), the same set of keys
      // (although not necessarily the same order), equivalent values for every
      // corresponding key, and an identical 'prototype' property. Note: this
      // accounts for both named and indexed properties on Arrays.
    } else {
      return objEquiv(actual, expected, opts)
    }
  }

  function isUndefinedOrNull(value) {
    return value === null || value === undefined
  }

  function isBuffer(x) {
    if (!x || typeof x !== "object" || typeof x.length !== "number")
      return false
    if (typeof x.copy !== "function" || typeof x.slice !== "function") {
      return false
    }
    const xs /*:any*/ = x
    if (xs.length > 0 && typeof xs[0] !== "number") return false
    return true
  }

  function objEquiv(left /*:any*/, right /*:any*/, opts) {
    let [a, b] = [left, right]
    var i, key
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) return false
    // an identical 'prototype' property.
    if (a.prototype !== b.prototype) return false
    //~~~I've managed to break Object.keys through screwy arguments passing.
    //   Converting to array solves the problem.
    if (isArguments(a)) {
      if (!isArguments(b)) {
        return false
      }
      a = pSlice.call(a)
      b = pSlice.call(b)
      return deepEqual(a, b, opts)
    }
    if (isBuffer(a)) {
      if (!isBuffer(b)) {
        return false
      }
      if (a.length !== b.length) return false
      for (i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    }
    try {
      var ka = objectKeys(a),
        kb = objectKeys(b)
    } catch (e) {
      //happens when one is a string literal and the other isn't
      return false
    }
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length != kb.length) return false
    //the same set of keys (although not necessarily the same order),
    ka.sort()
    kb.sort()
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i]) return false
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i]
      if (!deepEqual(a[key], b[key], opts)) return false
    }
    return typeof a === typeof b
  }

  var pSlice = Array.prototype.slice
  var objectKeys = Object.keys

  const isArguments = value =>
    Object.prototype.toString.call(value) == "[object Arguments]"

  const noOpts = Object.freeze({})

  global.test = class Tape extends ExtensionAPI /*::<*>*/ {
    import(context) {
      const exportClass = /*::<b, a:Class<b>>*/ (
        scope /*:Object*/,
        constructor /*:a*/
      ) /*:a*/ => {
        const clone = Cu.exportFunction(constructor, scope)
        const unwrapped = Cu.waiveXrays(clone)
        const prototype = Cu.waiveXrays(Cu.createObjectIn(scope))

        const source = constructor.prototype
        for (const key of Reflect.ownKeys(constructor.prototype)) {
          if (key !== "constructor") {
            const descriptor = Reflect.getOwnPropertyDescriptor(source, key)
            Reflect.defineProperty(
              prototype,
              key,
              Cu.waiveXrays(
                Cu.cloneInto(descriptor, scope, {
                  cloneFunctions: true
                })
              )
            )
          }
        }

        Reflect.defineProperty(unwrapped, "prototype", {
          value: prototype
        })
        Reflect.defineProperty(prototype, "constructor", {
          value: unwrapped
        })

        return clone
      }

      const exportInstance = /*::<a:Object, b:a>*/ (
        scope,
        constructor /*:Class<b>*/,
        properties /*::?:a*/
      ) /*:b*/ => {
        const instance /*:any*/ = properties
          ? Cu.cloneInto(properties, scope)
          : Cu.cloneInto({}, scope)
        Reflect.setPrototypeOf(
          Cu.waiveXrays(instance),
          Cu.waiveXrays(constructor).prototype
        )
        return instance
      }

      return { exportClass, exportInstance }
    }
    getAPI(context) {
      const { exportClass, exportInstance } = this.import(context)
      const refs = new WeakMap()
      const deref = key => {
        const value = refs.get(key)
        if (value == null) {
          throw new ExtensionError("Unable to find corresponding reference")
        } else {
          return value
        }
      }

      class Suite {
        /*::
      units:Test[]
      pendingCount:number
      assertCount:number
      status:"idle" | "busy" | "done"
      reporter:Reporter
      setTimeout:typeof setTimeout
      clearTimeout:typeof clearTimeout
      */
        constructor(reporter /*:Reporter*/ = new Reporter()) {
          this.units = []
          this.pendingCount = 0
          this.status = "idle"
          this.reporter = reporter
          this.assertCount = 0
          this.setTimeout = setTimeout
          this.clearTimeout = clearTimeout
        }
        // async run(self) {
        //   while (self.tests && self.tests.length > 0) {
        //     const { name, unit } = self.tests.shift()

        //     try {
        //       self.log(`start ${name}`)
        //       const test = exportInstance(context.cloneScope, Test)
        //       Reflect.defineProperty(Cu.waiveXrays(test), "name", { value: name })
        //       self.test = test

        //       await Reflect.apply(Cu.waiveXrays(unit), null, [test])

        //       self.log(`end ${name}`)
        //     } catch (error) {
        //       self.fail(`Exception was thrown: ${error.message}`)
        //     }
        //     delete self.test
        //   }
        //   self.tests = null
        //   self.log("---------- FIN ----------")
        // }
        test(name /*:string*/, unit /*:(Test) => mixed*/) {
          const test = new Test(this, name, unit)
          this.units.push(test)
          this.pendingCount++

          switch (this.status) {
            case "idle":
              return void this.run()
            case "busy":
              return void this
            case "done":
              return void this.reporter.report("", this.assertCount++, {
                type: "fail",
                message: ""
              })
          }
        }
        report(name /*:string*/, report /*:Report*/) {
          this.reporter.report(name, this.assertCount++, report)
        }
        async run() {
          const { units, reporter } = this
          this.status = "busy"
          let id = 1
          while (units.length > 0) {
            const unit = units.shift()
            const { name, skipped } = unit

            if (skipped) {
              this.reporter.report(name, id, {
                type: "comment",
                message: `SKIP ${name}`
              })
            } else {
              this.assertCount++
              reporter.report(name, id, { type: "start" })
              await unit.run()
              reporter.report(name, id, { type: "end" })
            }
            id++
          }
          reporter.report("suite", id, { type: "finish" })
        }
      }

      class Reporter {
        /*::
      index:number
      fail:number
      pass:number
      count:number
      */
        constructor() {
          this.index = 1
          this.fail = 0
          this.pass = 0
          this.count = 0
        }
        report(name /*:string*/, id /*:number*/, report /*:Report*/) {
          const index =
            report.type === "end"
              ? this.index
              : report.type === "start"
                ? this.index
                : this.index++

          switch (report.type) {
            case "start": {
              if (this.index === 0) {
                console.log("TAP version 13")
              }
              return console.log(`# ${name}`)
            }
            case "end": {
              return void this
            }
            case "finish": {
              console.log(`1..${this.count}`)
              return console.log("---------- FIN ----------")
            }
            case "comment": {
              return console.log(`# ${report.message}`)
            }
            case "fail": {
              this.count++
              this.fail++
              return console.log(`not ok ${index} ${report.message}`)
            }
            case "pass": {
              this.count++
              this.pass++
              return console.log(`ok ${index} ${report.message}`)
            }
            case "skip": {
              return console.log(`ok ${index} # skip ${report.message}`)
            }
            case "error": {
              this.count++
              this.fail++
              return console.log(
                `not ok ${index} ${String(report.error)}`,
                report.error
              )
            }
            case "ok":
            case "match": {
              const { isOk, message, value } = report
              this.count++
              if (isOk) {
                this.pass++
                return console.log(`ok ${index} ${message}`, value)
              } else {
                this.fail++
                return console.log(`not ok ${index} ${message}`, value)
              }
            }
            case "throws":
            case "doesNotThrow": {
              const { isOk, message } = report
              this.count++
              if (isOk) {
                this.pass++
                return console.log(`ok ${index} ${message}`)
              } else {
                this.fail++
                return console.log(`not ok ${index} ${message}`)
              }
            }
            case "compare": {
              const { isOk, message, actual, expect } = report
              this.count++
              if (isOk) {
                this.pass++
                return console.log(`ok ${index} ${message}`, actual, expect)
              } else {
                this.fail++
                return console.log(`not ok ${index} ${message}`, actual, expect)
              }
            }
          }
        }
      }

      class Test {
        /*::
      suite:Suite
      name:string
      skipped:boolean
      planned:?number
      units:Test[]
      isEnded:boolean
      unit:(Test) => mixed
      timeoutID:?TimeoutID;
      timeout:?number;
      abort:() => void;
      */
        constructor(suite, name, unit) {
          this.suite = suite
          this.name = name
          this.unit = unit
          this.skipped = false
          this.planned = null
          this.timeoutID = null
          this.isEnded = false
        }
        test(name, unit) {
          this.suite.test(name, unit)
        }
        comment(message) {
          this.assert({
            type: "comment",
            message
          })
        }
        fail(message) {
          this.assert({
            type: "fail",
            message
          })
        }
        pass(message) {
          this.assert({
            type: "pass",
            message
          })
        }
        skip(message) {
          this.assert({
            type: "skip",
            message
          })
        }
        ok(value, message = "should be truthy") {
          this.assert({
            type: "ok",
            isOk: !!value,
            value,
            message
          })
        }
        compare(
          operator /*:ComparisonOperator*/,
          isOk /*:boolean*/,
          actual,
          expect,
          message
        ) {
          this.assert({
            type: "compare",
            operator,
            isOk,
            message,
            actual,
            expect
          })
        }
        equal(actual, expected, message = "should be equal") {
          this.compare("equal", actual === expected, actual, expected, message)
        }
        notEqual(actual, expected, message = "should not be equal") {
          this.compare(
            "notEqual",
            actual !== expected,
            actual,
            expected,
            message
          )
        }
        deepEqual(actual, expected, message = "should be equivalent") {
          this.compare(
            "deepEqual",
            deepEqual(actual, expected, { strict: true }),
            actual,
            expected,
            message
          )
        }
        notDeepEqual(actual, expected, message = "should not be equivalent") {
          this.compare(
            "notDeepEqual",
            !deepEqual(actual, expected, { strict: true }),
            actual,
            expected,
            message
          )
        }
        deepLooseEqual(
          actual,
          expected,
          message = "should be loosely equivalent"
        ) {
          this.compare(
            "deepLooseEqual",
            deepEqual(actual, expected, { strict: false }),
            actual,
            expected,
            message
          )
        }
        notDeepLooseEqual(
          actual,
          expected,
          message = "should not be loosely equivalent"
        ) {
          this.compare(
            "notDeepLooseEqual",
            deepEqual(actual, expected, { strict: false }),
            actual,
            expected,
            message
          )
        }
        throws(
          fn /*:Function*/,
          expect /*:RegExp|Function*/,
          message /*:?string*/ = null
        ) {
          try {
            fn()
            this.assert({
              type: "throws",
              isOk: false,
              message: message || "should throw"
            })
          } catch (error) {
            if (expect instanceof RegExp) {
              const isOk = expect.test(error)
              this.assert({
                type: "match",
                isOk,
                message: message || "throw error should match RegExp",
                value: error,
                matcher: expect
              })
            } else if (typeof expect === "function") {
              const isOk = error instanceof expect
              this.assert({
                type: "match",
                isOk,
                message: message || "throw error did not match",
                value: error,
                matcher: expect
              })
            } else {
              this.assert({
                type: "throws",
                isOk: true,
                message: message || "should throw"
              })
            }
          }
        }
        doesNotThrow(
          fn /*:Function*/,
          message /*:string*/ = "should not throw"
        ) {
          try {
            fn()
            this.assert({
              type: "doesNotThrow",
              isOk: true,
              message: message
            })
          } catch (error) {
            this.assert({
              type: "doesNotThrow",
              isOk: false,
              message: message
            })
          }
        }
        assert(report /*:Report*/) {
          this.suite.report(this.name, report)
        }

        end() {
          const { isEnded, timeoutID } = this
          if (isEnded) {
            this.fail(".end() called twice")
          } else {
            if (timeoutID != null) {
              this.suite.clearTimeout(timeoutID)
              this.timeoutID = null
            }
            this.isEnded = true
            this.abort()
          }
        }

        async execute() {
          const test = exportInstance(context.cloneScope, TestAPI)
          refs.set(test, this)

          return Reflect.apply(Cu.waiveXrays(this.unit), null, [test])
        }
        async run() {
          const { timeout } = this
          if (timeout != null) {
            this.timeoutID = this.suite.setTimeout(
              Test.ontimeout,
              timeout,
              this,
              timeout
            )
          }

          const abort = new Promise(abort => (this.abort = abort))
          try {
            await Promise.race([this.execute(), abort])
          } catch (error) {
            this.assert({
              type: "error",
              error
            })
          }
        }
        static ontimeout(self, ms) {
          self.ontimeout(ms)
        }
        ontimeout(ms) {
          this.fail("test timed out after " + ms + "ms")
          this.abort()
        }

        timeoutAfter(ms) {
          this.timeoutID = setTimeout(Test.ontimeout, ms, this, ms)
        }
        plan(n) {
          this.planned = n
        }
      }

      const suite = new Suite()

      const api = {
        test: {
          test(name, fn) {
            suite.test(name, fn)
          }
        }
      }

      const TestAPI = exportClass(
        context.cloneScope,
        class Test {
          /*::
        name:string
        */
          test(name, unit) {
            deref(this).test(name, unit)
          }
          comment(message) {
            deref(this).comment(message)
          }
          fail(message) {
            deref(this).fail(message)
          }
          pass(message) {
            deref(this).pass(message)
          }
          skip(message) {
            deref(this).skip(message)
          }
          ok(value, message = "should be truthy") {
            deref(this).ok(value, message)
          }
          equal(actual, expected, message = "should be equal") {
            deref(this).equal(actual, expected, message)
          }
          notEqual(actual, expected, message = "should not be equal") {
            deref(this).notEqual(actual, expected, message)
          }
          deepEqual(actual, expected, message = "should be equivalent") {
            deref(this).deepEqual(actual, expected, message)
          }
          notDeepEqual(actual, expected, message = "should not be equivalent") {
            deref(this).notDeepEqual(actual, expected, message)
          }
          deepLooseEqual(
            actual,
            expected,
            message = "should be loosely equivalent"
          ) {
            deref(this).deepLooseEqual(actual, expected, message)
          }
          notDeepLooseEqual(
            actual,
            expected,
            message = "should not be loosely equivalent"
          ) {
            deref(this).notDeepLooseEqual(actual, expected, message)
          }
          throws(
            fn /*:Function*/,
            expect /*:RegExp|Function*/,
            message /*:?string*/ = null
          ) {
            deref(this).throws(fn, expect, message)
          }
          doesNotThrow(
            fn /*:Function*/,
            message /*:string*/ = "should not throw"
          ) {
            deref(this).doesNotThrow(fn, message)
          }
          end() {
            deref(this).end()
          }
          timeoutAfter(ms) {
            deref(this).timeoutAfter(Number(ms))
          }
          plan(n) {
            deref(this).plan(Number(n))
          }
        }
      )

      return api
    }
  }
}

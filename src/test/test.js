// @flow
/*::
import { Cu, Cr } from "gecko"
import type { nsIMessageSender } from "gecko"
import { ExtensionAPI, BaseContext } from "gecko"
*/

const { ExtensionUtils } = Cu.import(
  "resource://gre/modules/ExtensionUtils.jsm",
  {}
)
const { ExtensionError, getUniqueId } = ExtensionUtils

const { setTimeout } = Cu.import("resource://gre/modules/Timer.jsm", {})

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

    const api = {
      test: {
        test(name, fn) {
          runner.define(name, fn)
        }
      }
    }

    class Runner {
      /*::
      tests:?Unit[]
      test:Test
      */
      constructor() {
        this.tests = null
      }
      async run(self) {
        while (self.tests && self.tests.length > 0) {
          const { name, unit } = self.tests.shift()

          try {
            self.log(`start ${name}`)
            const test = exportInstance(context.cloneScope, Test)
            Reflect.defineProperty(Cu.waiveXrays(test), "name", { value: name })
            self.test = test

            await Reflect.apply(Cu.waiveXrays(unit), null, [test])

            self.log(`end ${name}`)
          } catch (error) {
            self.fail(`Exception was thrown: ${error.message}`)
          }
          delete self.test
        }
        self.tests = null
        self.log("---------- FIN ----------")
      }
      define(name, fn) {
        const test = new Unit(name, fn)
        if (this.tests == null) {
          this.tests = [test]
          setTimeout(this.run, 0, this)
        } else {
          this.tests.push(test)
        }
      }
      log(message) {
        console.log(message)
      }
      fail(message, test = this.test) {
        if (test === this.test) {
          this.log(`Fail: ${message}`)
        } else {
          throw new ExtensionError(`Test ${test.name} was already complete`)
        }
      }
      end(test) {
        if (test !== this.test) {
          throw new ExtensionError(`Test ${test.name} was already complete`)
        }
      }
      pass(message, test = this.test) {
        if (test === this.test) {
          this.log(`Pass: ${message}`)
        } else {
          throw new ExtensionError(`Test ${test.name} was already complete`)
        }
      }
    }

    class Unit {
      /*::
      name:string
      unit:(Test) => Promise<mixed>
      */
      constructor(name, unit) {
        this.name = name
        this.unit = unit
      }
    }
    const runner = new Runner()

    const Test = exportClass(
      context.cloneScope,
      class Test {
        /*::
        name:string
        */
        ok(value, message = `value ${value} should be truthy`) {
          if (value) {
            runner.pass(message, this)
          } else {
            runner.fail(message, this)
          }
        }
        fail(message) {
          runner.fail(message, this)
        }
        pass(message) {
          runner.pass(message, this)

          console.log(`Pass: ${message}`)
        }
        skip(message) {}
        equal(actual, expected, message) {
          if (actual === expected) {
            runner.pass(message, this)
          } else {
            runner.fail(message, this)
          }
        }
        notEqual(actual, expected, message) {
          if (actual === expected) {
            runner.fail(message, this)
          } else {
            runner.pass(message, this)
          }
        }
        deepEquals(actual, expected, message) {}
        end() {
          runner.end(this)
        }
      }
    )

    return api
  }
}

// @flow strict
/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {BaseContext} from "gecko"
*/

console.log(">>>>>>>>>>>>>>>>>>>")

global.FileSystem = class extends ExtensionAPI /*::<*>*/ {
  getAPI(context) {
    return {
      FileSystem: {
        readDirectory2(url, options) {
          return new context.cloneScope.Promise((resolve, reject) => {
            const out = {
              next() {
                return Cu.cloneInto(
                  { done: false, value: url },
                  context.cloneScope
                )
              },
              return() {
                return {}
              },
              init() {
                const $Symbol /*:any*/ = Symbol
                this[$Symbol.asyncIterator] = Cu.waiveXrays(this).asyncIterator
                delete this.init
              },
              asyncIterator() {
                return this
              }
            }

            const cloned = Cu.cloneInto(out, context.cloneScope, {
              cloneFunctions: true
            })
            Cu.waiveXrays(cloned).init()

            Reflect.apply(resolve, null, [cloned])

            // resolve(
            //   Cu.cloneInto(
            //     out,
            //     context.cloneScope,
            //     {
            //       cloneFunctions: true
            //     }
            //   )
            // )
          })
        }
      }
    }
  }
}

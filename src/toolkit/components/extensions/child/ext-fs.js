// @flow strict
/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {BaseContext} from "gecko"

type WatcherNotification = {
  url:string;
}
*/

global.FileSystem = class extends ExtensionAPI /*::<*>*/ {
  getAPI(context) {
    const $Symbol /*:any*/ = Symbol

    const address = `libdweb/FileSystem/Watcher/notify`
    context.messageManager.addMessageListener(address, {
      receiveMessage(message) {
        switch (message.name) {
          case address: {
            const { id, url, flags } = message.data
            const watcher = watchers[id]
            if (watcher) {
              watcher.changed({ url, flags })
            }
            break
          }
        }
      }
    })

    const watchers = Object.create(null)

    class Watcher /*::implements AsyncIterable<WatcherNotification>*/ {
      /*::
      id:string;
      url:string;
      @@asyncIterator: () => self
      notify: ?({value:WatcherNotification}|{done:true}) => void
      done:boolean
      */
      constructor(url /*:string*/, id /*:string*/) {
        this.url = url
        this.id = id
        this.done = false
        const self /*:Object*/ = this
        self.next = this.next
        self.return = this.return
        self.changed = this.changed
      }
      changed(value) {
        const self = Cu.waiveXrays(this)
        const { notify } = self
        self.notify = null
        if (notify) {
          if (!self.done) {
            notify(Cu.cloneInto({ value, done: false }, context.cloneScope))
          }
        }
      }
      next() /*:Promise<{value:WatcherNotification}|{done:true}>*/ {
        return new context.cloneScope.Promise((resolve, reject) => {
          const self = Cu.waiveXrays(this)
          if (self.done) {
            resolve({ done: true })
          } else {
            self.notify = resolve
          }
        })
      }
      return() /*:Promise<{done:true}>*/ {
        return Watcher.promise(async () => {
          await context.childManager.callParentAsyncFunction(
            "FileSystem.stopWatcher",
            [this.id]
          )
          delete watchers[this.id]
          const done = Cu.cloneInto({ done: true }, context.cloneScope)
          const self = Cu.waiveXrays(this)
          const { notify } = self
          if (notify) {
            self.notify = null
            self.done = true
            notify(done)
          }
          return done
        })
      }
      static promise(fn) {
        return new context.cloneScope.Promise((resolve, reject) => {
          fn().then(resolve, reject)
        })
      }
      static new(url, options) {
        return new context.cloneScope.Promise(async (resolve, reject) => {
          const id = await context.childManager.callParentAsyncFunction(
            "FileSystem.startWatcher",
            [url, options]
          )

          const self = new Watcher(url, id)
          const watcher = Cu.cloneInto(self, context.cloneScope, {
            cloneFunctions: true
          })

          const unwrappedWatcher /*:Object*/ = Cu.waiveXrays(watcher)
          watchers[id] = unwrappedWatcher
          unwrappedWatcher[$Symbol.asyncIterator] = Cu.exportFunction(
            function() {
              return this
            },
            context.cloneScope
          )

          return Reflect.apply(resolve, null, [watcher])
        })
      }
    }
    return {
      FileSystem: {
        watch(url, options) {
          return Watcher.new(url, options)
        }
      }
    }
  }
}

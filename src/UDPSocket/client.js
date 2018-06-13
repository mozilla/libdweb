// @flow strict
/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {BaseContext} from "gecko"
import type {UDPSocket, UDPMessage, SocketAddress} from "./UDPSocket"

interface UDPSocketClient {
  +UDPSocket: {
    messages(UDPSocket):AsyncIterator<UDPMessage>;
  }
}
*/

const INBOX = "libdweb/UDPSocket/message"

global.UDPSocket = class extends ExtensionAPI /*::<UDPSocketClient>*/ {
  getAPI(context) {
    const $Symbol /*:any*/ = Symbol
    const iterators = Object.create(null)

    context.messageManager.addMessageListener(INBOX, {
      receiveMessage(message) {
        switch (message.name) {
          case INBOX: {
            console.log("UDPSocketClient.receiveMessage", message.data)
            const iterator = iterators[message.data.to]
            if (message.data.done) {
              if (iterator) {
                if (message.data.status === Cr.NS_BINDING_ABORTED) {
                  iterator.break()
                } else {
                  iterator.throw(
                    new Error(
                      `Socket closed with error: ${message.data.status} `
                    )
                  )
                }
              }
            } else if (iterator) {
              const { data, from } = message.data
              iterator.continue(
                Cu.cloneInto({ data, from }, context.cloneScope)
              )
            } else if (message.data.done) {
              throw Error("Received UPD message for socket that has no client")
            }
          }
        }
      }
    })

    class RemoteIterator /*::implements AsyncIterator<UDPMessage>*/ {
      /*::
      socket:UDPSocket;
      id:string;
      @@asyncIterator: () => self
      promise: ?{resolve:({value:UDPMessage, done:false}|{done:true}) => void, reject:Error => void}
      done:boolean
      */
      constructor(id /*:string*/, socket /*:UDPSocket*/) {
        this.socket = socket
        this.id = id
        this.done = false
        const self /*:Object*/ = this
        self.next = this.next
        self.return = this.return
        self.continue = this.continue
      }
      continue(value) {
        const self = Cu.waiveXrays(this)
        const { promise } = self
        self.promise = null
        debug &&
          console.log("UDPSocketClient.AsyncIterator.continue", promise, value)
        if (promise) {
          if (!self.done) {
            promise.resolve(
              Cu.cloneInto({ value, done: false }, context.cloneScope)
            )
          }
        }
      }
      break() {
        const self = Cu.waiveXrays(this)
        const { promise } = self
        self.promise = null
        debug && console.log("UDPSocketClient.AsyncIterator.break", promise)
        if (promise) {
          if (!self.done) {
            promise.resolve(Cu.cloneInto({ done: true }, context.cloneScope))
          }
        }
      }
      throw(message) {
        const self = Cu.waiveXrays(this)
        const { promise } = self
        self.promise = null
        debug &&
          console.log("UDPSocketClient.AsyncIterator.throw", promise, message)
        if (promise) {
          if (!self.done) {
            promise.reject(Cu.cloneInto(new Error(message), context.cloneScope))
          }
        }
      }
      next() /*:Promise<{value:UDPMessage, done:false}|{done:true, value:void}>*/ {
        return new context.cloneScope.Promise((resolve, reject) => {
          const self = Cu.waiveXrays(this)
          if (self.done) {
            resolve({ done: true })
          } else {
            self.promise = { resolve, reject }
          }
        })
      }
      return() /*:Promise<{done:true}>*/ {
        return RemoteIterator.promise(async () => {
          await context.childManager.callParentAsyncFunction(
            "UDPSocket.removeMessageListener",
            [this.id]
          )

          delete iterators[this.id]
          const done = Cu.cloneInto({ done: true }, context.cloneScope)
          const self = Cu.waiveXrays(this)
          const { promise } = self
          if (promise) {
            self.promise = null
            self.done = true
            promise.resolve(done)
          }
          return done
        })
      }
      static promise(fn) {
        return new context.cloneScope.Promise((resolve, reject) => {
          fn().then(resolve, reject)
        })
      }
      static new(socket) {
        // return new context.cloneScope.Promise(async (resolve, reject) => {
        //const id = await
        context.childManager.callParentAsyncFunction(
          "UDPSocket.setMessageListener",
          [socket]
        )

        const { id } = socket
        const self = new this(id, socket)
        const iterator = Cu.cloneInto(self, context.cloneScope, {
          cloneFunctions: true
        })

        const unwrappedIterator /*:Object*/ = Cu.waiveXrays(iterator)
        iterators[id] = unwrappedIterator
        unwrappedIterator[$Symbol.asyncIterator] = Cu.exportFunction(
          function() {
            return this
          },
          context.cloneScope
        )

        return iterator
        //   return Reflect.apply(resolve, null, [iterator])
        // })
      }
    }

    debug && console.log("UDPSocketClient.new")

    return {
      UDPSocket: {
        FAMILY_INET: Ci.nsINetAddr.FAMILY_INET,
        FAMILY_INET6: Ci.nsINetAddr.FAMILY_INET6,
        FAMILY_LOCAL: Ci.nsINetAddr.FAMILY_LOCAL,
        messages(socket /*:UDPSocket*/) /*:AsyncIterator<UDPMessage>*/ {
          debug && console.log("UDPSocketClient.messages")
          return RemoteIterator.new(socket)
        }
      }
    }
  }
}

const debug = true

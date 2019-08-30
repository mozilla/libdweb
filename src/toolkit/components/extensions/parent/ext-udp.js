// @flow strict

/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"

import type {BaseContext, nsIUDPSocket, nsIUDPSocketListener, nsINetAddr} from "gecko"
import type {
  UDPSocket,
  UDPSocketManager,
  UDPMessage,
  SocketAddress,
  SocketOptions,
  Family
} from "../interface/udp"

interface Host {
  +UDPSocket: UDPSocketManager;
}
*/
Cu.importGlobalProperties(["URL"])

{
  global.UDPSocket = class extends ExtensionAPI /*::<Host>*/ {
    getAPI(context) {
      const sockets = new Map()
      const messages = new Map()
      const notFoundPromise = "not found"

      class MessagesHost {
        /*::
        socket:nsIUDPSocket
        requests:{resolve({done:false, value:UDPMessage}|{done:true}):void, reject(Error):void}[]
        responses:Promise<{done:false, value:UDPMessage}>[]
        isDone:boolean
        done:Promise<{done:true, value:void}>
        scope:Object
        */
        constructor(socket) {
          this.socket = socket
          this.isDone = false
          this.requests = []
          this.responses = []
          this.scope = context.cloneScope
        }
        onPacketReceived(socket, message) {
          const { scope } = this
          debug && console.log(`UDPSocket/onPacketReceived`, message)
          const { address, port, family } = message.fromAddr
          this.continue(
            Cu.cloneInto(
              [
                message.rawData.buffer,
                Cu.cloneInto({ address, port, family }, scope)
              ],
              scope
            )
          )
        }
        onStopListening(socket, status) {
          debug && console.log(`UDPSocket/onStopListening`, status)

          if (status === Cr.NS_BINDING_ABORTED) {
            return this.break()
          } else {
            return this.throw(
              new Error(`Socket was closed with error: ${status}`)
            )
          }
        }
        continue(value) {
          const { requests, isDone, responses, scope } = this
          if (isDone) {
            throw Error("Received message after iteration was done")
          } else {
            debug && console.log("UDPSocket.MessagesHost.continue", value)
            const nextIteration = { done: false, value }
            const request = requests.shift()
            if (request) {
              request.resolve(nextIteration)
            } else {
              responses.push(scope.Promise.resolve(nextIteration))
            }
          }
        }
        break() {
          const { requests } = this
          for (const request of requests) {
            request.resolve({ done: true })
          }
        }
        throw(error) {
          const { requests } = this
          for (const request of requests) {
            request.reject(error)
          }
        }
        next() {
          const { responses, requests, done, isDone } = this
          const response = responses.shift()
          if (response) {
            return response
          } else if (isDone) {
            return done
          } else {
            return new context.cloneScope.Promise((resolve, reject) => {
              requests.push({ resolve, reject })
            })
          }
        }
        return() {
          const { isDone, done } = this
          if (!isDone) {
            this.isDone = true
            this.socket.close()
          }
          return { done: true }
        }
      }

      context.callOnClose({
        close() {
          for (const socket of sockets.values()) {
            socket.close()
          }
          sockets.clear()
        }
      })
      let socketIdx = 0

      return {
        UDPSocket: {
          create: options => {
            return new Promise((resolve, reject) => {
              try {
                const socket = Cc[
                  "@mozilla.org/network/udp-socket;1"
                ].createInstance(Ci.nsIUDPSocket)

                if (options.host != null) {
                  socket.init2(
                    options.host,
                    options.port || -1,
                    null,
                    options.addressReuse != false
                  )
                } else {
                  socket.init(
                    options.port || -1,
                    options.loopbackOnly != false,
                    null,
                    options.addressReuse != false
                  )
                }

                const { address, port, family } = socket.localAddr
                const id = ++socketIdx
                sockets.set(id, socket)
                debug && console.log(`UDPSocket/create`, socket.localAddr)

                resolve({
                  id,
                  address,
                  port,
                  family
                })
              } catch (error) {
                reject(error.message)
              }
            })
          },
          close: socketId => {
            return new context.cloneScope.Promise((resolve, reject) => {
              if (sockets.has(socketId)) {
                const socket = sockets.get(socketId)
                debug && console.log(`UDPSocket/close`, socket.localAddr)
                socket.close()
                sockets.delete(socketId)
                resolve()
              } else {
                reject(notFoundPromise)
              }
            })
          },
          send: (socketId, host, port, data, size) => {
            return new context.cloneScope.Promise((resolve, reject) => {
              if (sockets.has(socketId)) {
                const socket = sockets.get(socketId)
                debug && console.log(`UDPSocket/send`, socket.localAddr, data)
                const n = socket.send(
                  host,
                  port,
                  new Uint8Array(data),
                  size || data.byteLength
                )
                resolve(n)
              } else {
                reject(notFoundPromise)
              }
            })
          },
          setMulticastLoopback: (socketId, flag) => {
            return new context.cloneScope.Promise((resolve, reject) => {
              if (sockets.has(socketId)) {
                const socket = sockets.get(socketId)
                socket.multicastLoopback = flag
                resolve()
              } else {
                reject(notFoundPromise)
              }
            })
          },
          setMulticastInterface: (socketId, multicastInterface) => {
            return new context.cloneScope.Promise((resolve, reject) => {
              if (sockets.has(socketId)) {
                const socket = sockets.get(socketId)
                socket.multicastInterface = multicastInterface
                resolve()
              } else {
                reject(notFoundPromise)
              }
            })
          },
          joinMulticast: (socketId, address, multicastInterface) => {
            return new context.cloneScope.Promise((resolve, reject) => {
              if (sockets.has(socketId)) {
                const socket = sockets.get(socketId)
                socket.joinMulticast(address, multicastInterface)
                resolve()
              } else {
                reject(notFoundPromise)
              }
            })
          },
          leaveMulticast: (socketId, address, multicastInterface) => {
            return new context.cloneScope.Promise((resolve, reject) => {
              if (sockets.has(socketId)) {
                const socket = sockets.get(socketId)
                socket.leaveMulticast(address, multicastInterface)
                resolve()
              } else {
                reject(notFoundPromise)
              }
            })
          },
          pollMessages: socketId => {
            return new context.cloneScope.Promise((resolve, reject) => {
              if (!sockets.has(socketId)) {
                return reject(notFoundPromise)
              }
              let host
              if (!messages.has(socketId)) {
                const socket = sockets.get(socketId)
                host = new MessagesHost(socket)
                socket.asyncListen(host)
                messages.set(socketId, host)
              } else {
                host = messages.get(socketId)
              }
              resolve(host.next())
            })
          },
          returnHost: socketId => {
            return new context.cloneScope.Promise((resolve, reject) => {
              if (!sockets.has(socketId) || !messages.has(socketId)) {
                return reject(notFoundPromise)
              }
              const result = messages.get(socketId).return()
              resolve(result)
            })
          }
        }
      }
    }
  }

  const debug = false
}

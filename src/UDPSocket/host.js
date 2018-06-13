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
} from "./UDPSocket"

interface Host {
  +UDPSocket: UDPSocketManager;
}
*/
Cu.importGlobalProperties(["URL"])
const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})
const { OS } = Cu.import("resource://gre/modules/osfile.jsm", {})
const { ExtensionUtils } = Cu.import(
  "resource://gre/modules/ExtensionUtils.jsm",
  {}
)

const { ExtensionError } = ExtensionUtils

const MAILBOX = "libdweb/UDPSocket/message"
class IOError extends ExtensionError {
  static throw(message) /*:empty*/ {
    const self = new this(message)
    throw self
  }
}

class Address /*::implements SocketAddress*/ {
  /*::
  host:string;
  port:number;
  family:Family;
  */
  static from({ address, port, family } /*:nsINetAddr*/) {
    return new this(address, port, family)
  }
  constructor(host, port, family) {
    this.host = host
    this.port = port
    this.family = family
  }
}
class Socket /*::implements UDPSocket*/ {
  /*::
  id: string;
  address: SocketAddress;
  */
  constructor(id, address) {
    this.id = id
    this.address = address
  }
}

class UDPSocketHost /*::implements UDPSocketManager*/ {
  /*::
  context:BaseContext;
  sockets:{[string]:nsIUDPSocket}
  listeners:{[string]:nsIUDPSocketListener}
  nextSocketID:number

  messages:(UDPSocket) => AsyncIterator<UDPMessage>
  */
  constructor(context /*:BaseContext*/) {
    const sockets /*: Object*/ = Object.create(null)
    const listeners /*:Object*/ = Object.create(null)
    this.context = context
    this.sockets = sockets
    this.listeners = listeners
    this.nextSocketID = 0
  }

  async create(options /*:SocketOptions*/) /*: Promise<UDPSocket>*/ {
    try {
      const socket = Cc["@mozilla.org/network/udp-socket;1"].createInstance(
        Ci.nsIUDPSocket
      )

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

      const id = `UPDSocket@${++this.nextSocketID}`
      this.sockets[id] = socket
      return new Socket(id, Address.from(socket.localAddr))
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async close({ id } /*:UDPSocket*/) /*: Promise<void>*/ {
    const socket = this.sockets[id]
    if (socket) {
      delete this.sockets[id]
      return socket.close()
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
  async send(
    { id } /*:UDPSocket*/,
    host /*: string*/,
    port /*: number*/,
    data /*: ArrayBuffer*/,
    size /*::?: number*/
  ) /*: Promise<number>*/ {
    const socket = this.sockets[id]
    if (socket) {
      return socket.send(
        host,
        port,
        new Uint8Array(data),
        size || data.byteLength
      )
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
  async setMulticastLoopback(
    { id } /*:UDPSocket*/,
    flag /*:boolean*/
  ) /*: Promise<void>*/ {
    const socket = this.sockets[id]
    if (socket) {
      socket.multicastLoopback = flag
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
  async setMulticastInterface(
    { id } /*:UDPSocket*/,
    multicastInterface /*:string*/
  ) /*: Promise<void>*/ {
    const socket = this.sockets[id]
    if (socket) {
      socket.multicastInterface = multicastInterface
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
  async addMembership(
    { id } /*:UDPSocket*/,
    address /*: string*/,
    multicastInterface /*::?: string*/
  ) /*: Promise<void>*/ {
    const socket = this.sockets[id]
    if (socket) {
      socket.joinMulticast(address, multicastInterface)
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
  async dropMembership(
    { id } /*:UDPSocket*/,
    address /*: string*/,
    multicastInterface /*::?: string*/
  ) /*: Promise<void>*/ {
    const socket = this.sockets[id]
    if (socket) {
      socket.leaveMulticast(address, multicastInterface)
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
  setMessageListener({ id } /*:UDPSocket*/) {
    const { context, sockets, listeners } = this
    const socket = sockets[id]
    if (socket) {
      const listener = {
        onPacketReceived(socket, message) {
          context.parentMessageManager.sendAsyncMessage(MAILBOX, {
            to: id,
            done: false,
            from: Address.from(message.fromAddr),
            data: message.rawData.buffer
          })
        },
        onStopListening(socket, status) {
          delete sockets[id]
          context.parentMessageManager.sendAsyncMessage(MAILBOX, {
            to: id,
            done: true,
            status
          })
        }
      }
      socket.asyncListen(listener)
      listeners[id] = listener
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }

  async removeMessageListener({ id } /*:UDPSocket*/) /*:Promise<void>*/ {
    const listener = this.listeners[id]
    if (listener) {
      delete this.listeners[id]
    } else {
      return IOError.throw("Unable to find corresponding socket")
    }
  }
  static new(context /*:BaseContext*/) {
    return new this(context)
  }
}

global.UDPSocket = class extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    debug && console.log("UDPSocketHost.new")
    const socketManager = UDPSocketHost.new(context)

    return {
      UDPSocket: {
        create: options => socketManager.create(options),
        close: socket => socketManager.close(socket),
        send: (socket, host, port, data, size) =>
          socketManager.send(socket, host, port, data, size),
        messages: socket => socketManager.messages(socket),
        setMessageListener: socket => socketManager.setMessageListener(socket),
        removeMessageListener: socket =>
          socketManager.removeMessageListener(socket),
        setMulticastLoopback: (socket, flag) =>
          socketManager.setMulticastLoopback(socket, flag),
        setMulticastInterface: (socket, multicastInterface) =>
          socketManager.setMulticastInterface(socket, multicastInterface),
        addMembership: (socket, address, multicastInterface) =>
          socketManager.addMembership(socket, address, multicastInterface),
        dropMembership: (socket, address, multicastInterface) =>
          socketManager.addMembership(socket, address, multicastInterface)
      }
    }
  }
}

const debug = true

// @flow strict

/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {BaseContext, nsIUDPSocket} from "gecko"
import type {UDPSocket, UDPSocketManager, SocketOptions, Family} from "./UDPSocket"

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
class IOError extends ExtensionError {
  /*::
  operation:string;
  becauseExists:boolean;
  becauseNoSuchFile:boolean;
  becauseClosed:boolean;
  code:number;
  */
  static throw(message) /*:empty*/ {
    const self = new this(message)
    throw self
  }
}

class Socket /*::implements UDPSocket*/ {
  /*::
  id: string;
  address: string;
  port: number;
  flow: number;
  scope: number;
  isV4Mapped: boolean;
  family: Family;
  */
  constructor(id, { address, port, flow, scope, isV4Mapped, family }) {
    this.id = id
    this.address = address
    this.port = port
    this.family = family
    this.flow = flow
    this.scope = scope
    this.isV4Mapped = isV4Mapped
  }
}

class UDPSocketHost /*::implements UDPSocketManager*/ {
  /*::
  context:BaseContext;
  sockets:{[string]:nsIUDPSocket}
  nextSocketID:number
  */
  constructor(context /*:BaseContext*/) {
    const sockets: Object = Object.create(null)
    this.context = context
    this.sockets = sockets
    this.nextSocketID = 0
  }

  async create(options /*:SocketOptions*/) /*: Promise<UDPSocket>*/ {
    const socket = Cc["@mozilla.org/network/udp-socket;1"].createInstance(
      Ci.nsIUDPSocket
    )
    if (options.address != null) {
      socket.init2(
        options.address,
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

    const address = socket.localAddr
    const id = `UPDSocket@${++this.nextSocketID}`
    this.sockets[id] = socket
    return new Socket(id, address)
  }
  async close({ id } /*:UDPSocket*/) /*: Promise<void>*/ {
    const socket = this.sockets[id]
    if (socket) {
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
  ): Promise<number> {
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
  messages(
    { id } /*:UDPSocket*/
  ) /*: AsyncIterator<{ socket: UDPSocket, data: ArrayBuffer }>*/ {
    const socket = this.sockets[id]
    if (socket) {
      return IOError.throw("Implemented on client side")
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
  ): Promise<void> {
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

  static new(context /*:BaseContext*/) {
    const fs = new this(context)
    return fs
  }
}

global.UDPSocket = class extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    const socketManager = UDPSocketHost.new(context)

    return {
      UDPSocket: {
        create: options => socketManager.create(options),
        close: socket => socketManager.close(socket),
        send: (socket, host, port, data, size) =>
          socketManager.send(socket, host, port, data, size),
        messages: socket => socketManager.messages(socket),
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

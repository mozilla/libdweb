/* @flow */

import type {
  nsIURI,
  nsIIDRef,
  nsIChannel,
  nsIFactory,
  nsISupports,
  nsILoadInfo,
  nsIProtocolHandler
} from "./gecko"
import {Cc, Ci, Cr, Cm, CID} from "./gecko"
import CIDS from "cids"

const ioService =
  Cc['@mozilla.org/network/io-service;1'].
  getService(Ci.nsIIOService)

const standardURL =
  Cc["@mozilla.org/network/standard-url;1"].
  createInstance(Ci.nsIStandardURL)

standardURL.QueryInterface(Ci.nsIURL)

const runtime =
  Cc["@mozilla.org/xre/app-info;1"].
  getService(Ci.nsIXULRuntime)

const childProcessMessageManager =
  Cc["@mozilla.org/childprocessmessagemanager;1"].
  getService(Ci.nsISyncMessageSender)

const parentProcessMessageManager =
  Cc["@mozilla.org/parentprocessmessagemanager;1"].
  getService(Ci.nsIMessageBroadcaster)

const securityManager =
  Cc["@mozilla.org/scriptsecuritymanager;1"].
  getService(Ci.nsIScriptSecurityManager)

const componentRegistrar = Cm.QueryInterface(Ci.nsIComponentRegistrar)

declare var __URI__:string
declare function dump (text:string):void

// export class FSURI {
//   originCharset:string
//   spec:string
//   asciiSpec:string
//   host:string
//   asciiHost:string
//   hostPort:string
//   asciiHostPort:string
//   query:string
//   ref:string
//   hasRef:boolean
//   path:string
//   prePath:string
//   specIgnoringRef:string
//   filePath:string
//   scheme:string = 'fs'
//   password:string = ''
//   username:string = ''
//   userPass:string = ''
//   port:number = -1
//   mutable:boolean = false
//   contractID:string|null = '@mozilla.org/network/ipfs-uri;1'
//   classID:nsIIDRef = CID('{1148f30c-0ec7-4a43-8802-cfafc0c9dd9a}')
//   classDescription:string = 'ipfs protocol uri'
//   static create(id:string,
//                 protocol:string,
//                 filePath:string,
//                 query:string,
//                 ref:string,
//                 originCharset:string):FSURI {
//     const host = `${protocol}/${id}`
//     const search = query === ''
//       ? query
//       : `?${query}`
//     const hash = ref === ''
//       ? ref
//       : `#${ref}`
//     const prePath = `fs://${host}`
//     const path = `${filePath}${search}${hash}`
//     const spec = `${prePath}${path}`
//     const specIgnoringRef = search === ''
//       ? spec
//       : spec.substr(0, spec.length - search.length)
//
//     return new FSURI(spec, originCharset, host, prePath, path, filePath, query, ref, specIgnoringRef)
//   }
//   constructor(spec:string,
//               originCharset:string,
//               host:string,
//               prePath:string,
//               path:string,
//               filePath:string,
//               query:string,
//               ref:string,
//               specIgnoringRef:string) {
//     this.originCharset  = originCharset
//     this.asciiSpec = this.spec
//     this.host = host
//     this.asciiHost = this.host
//     this.hostPort = this.host
//     this.asciiHostPort = this.host
//     this.ref = ref
//     this.hasRef = this.ref === ''
//     this.prePath =  prePath
//     this.path = path
//     this.spec = spec
//     this.specIgnoringRef = specIgnoringRef
//     this.filePath = filePath
//   }
//   QueryInterface(iid:nsIIDRef):nsIURI {
//     if (iid.equals(Ci.nsIURI) ||
//         iid.equals(Ci.nsISupports) ||
//         iid.equals(Ci.nsIURL) ||
//         iid.equals(Ci.nsIMutable)) {
//       return this
//     } else {
//       dump(`!!! FSURI.QueryInterface ${iid.name} ${iid.number}\n`)
//       throw Cr.NS_ERROR_NO_INTERFACE
//     }
//   }
//   clone():self {
//     return this.cloneWithNewRef(this.ref)
//   }
//   cloneIgnoringRef():self {
//     return this.cloneWithNewRef('')
//   }
//   cloneWithNewRef(newRef:string):self {
//     dump(`FSURI.cloneWithNewRef ${newRef}\n`)
//     const path = this.ref === newRef
//       ? this.path
//       : this.ref === ''
//       ? `${this.path}#${newRef}`
//       : `${this.path.substr(this.path.length - this.ref.length - 1)}#${newRef}`
//     const spec = `${this.prePath}${path}`
//
//     return new FSURI(spec,
//                       this.originCharset,
//                       this.host,
//                       this.prePath,
//                       path,
//                       this.filePath,
//                       this.query,
//                       newRef,
//                       this.specIgnoringRef)
//   }
//   equals(other:nsIURI):boolean {
//     dump(`FSURI.equals ${other.spec}\n`)
//     return other.spec === this.spec
//   }
//   equalsExceptRef(other:nsIURI):boolean {
//     dump(`FSURI.equalsExceptRef ${other.specIgnoringRef}\n`)
//     return other.specIgnoringRef === this.specIgnoringRef
//   }
//   resolve(relativePath:string):string {
//     dump(`FSURI.resolve ${relativePath}\n`)
//     standardURL.init(Ci.nsIStandardURL.URLTYPE_STANDARD,
//                       this.port,
//                       this.spec,
//                       this.originCharset,
//                       null)
//     return standardURL.resolve(relativePath)
//   }
//   schemeIs(scheme:string):boolean {
//     return this.scheme === scheme
//   }
//   setHostAndPort(hostport:string):void {
//     dump(`!!! FSURI.setHostAndPort ${hostport}\n`)
//     throw Error('fs protocol does no support host and port updates')
//   }
// }

export class FSURL {
  static parse(spec:string) {
    const [scheme, ..._] = spec.split(':')
    const [protocol, id, ...pathEntries] =
      spec.substr(scheme.length).split(/:\/*/)[1].split('/')
    const path = pathEntries.length === 0
      ? ''
      : `/${pathEntries.join('/')}`

    return new FSURL(scheme, protocol, id, path)
  }
  scheme:string
  protocol:string
  id:string
  path:string
  constructor(scheme:string, protocol:string, id:string, path:string) {
    this.scheme = scheme
    this.protocol = protocol
    this.id = id
    this.path = path
  }
}

export class FSProtocolHandler {
  defaultPort:number = -1
  protocolFlags:number
    = Ci.nsIProtocolHandler.URI_LOADABLE_BY_SUBSUMERS
    | Ci.nsIProtocolHandler.ORIGIN_IS_FULL_SPEC
  scheme:string = 'fs'
  allowPort(port:number, scheme:string) {
    return false
  }
  newURI(spec:string, charset:string, baseURI:null|nsIURI):nsIURI {
    dump(`FSProtocolHandler.newURI(${JSON.stringify(spec)}, ${JSON.stringify(charset)}, ${baseURI==null ? 'null' : baseURI.spec})\n`)
    if (baseURI === null || spec.startsWith(`${this.scheme}:`)) {
      const {protocol, id, path} = FSURL.parse(spec)
      const url = new IP$$URL(protocol, id, path)
      return ioService.newURI(IP$$URL.toBase16Encoded(url).toString(),
                              charset,
                              baseURI)
    } else {
      throw Error(`FS Protocol handler did not expected to resolve ${spec} relative to ${baseURI.spec}`)
    }
  }
  newChannel(uri:nsIURI):nsIChannel {
    return this.newChannel2(uri, null)
  }
  newChannel2(uri:nsIURI, loadInfo:null|nsILoadInfo):nsIChannel {
    dump(`FSProtocolHandler.newChannel2(${JSON.stringify(uri.spec)}, ${String(loadInfo)})\n`)
    throw new Error(`Did not expect to create channel for ${uri.spec}`)
  }
  QueryInterface(iid:nsIIDRef):nsIProtocolHandler {
    if (iid.equals(Ci.nsIProtocolHandler) ||
        iid.equals(Ci.nsISupports)) {
      return this
    }
    dump(`!!! FSProtocolHandler.QueryInterface ${iid.name} ${iid.number}\n`)
    throw Cr.NS_ERROR_NO_INTERFACE
  }
}

export class IP$$URL {
  static parse(spec:string):IP$$URL {
    const [scheme, ..._] = spec.split(':')
    const [id, ...pathEntries] =
      spec.substr(scheme.length).split(/:\/*/)[1].split('/')
    const path = pathEntries.length === 0
      ? ''
      : `/${pathEntries.join('/')}`

    return new IP$$URL(scheme, id, path)
  }
  static toBase16Encoded(uri:IP$$URL):IP$$URL {
    return new IP$$URL(uri.scheme,
                        new CIDS(uri.id).toV1().toBaseEncodedString('base16'),
                        uri.path)
  }
  static toBaseEncodedV0(uri:IP$$URL):IP$$URL {
    return new IP$$URL(uri.scheme,
                        new CIDS(uri.id).toV0().toBaseEncodedString('base58btc'),
                        uri.path)
  }
  scheme:string
  id:string
  path:string
  constructor(scheme:string, id:string, path:string) {
    this.scheme = scheme
    this.id = id
    this.path = path
  }
  toBase16Encoded():IP$$URL {
    return IP$$URL.toBase16Encoded(this)
  }
  toBaseEncodedV0():IP$$URL {
    return IP$$URL.toBaseEncodedV0(this)
  }
  toString():string {
    return `${this.scheme}://${this.id}${this.path}`
  }
}

export class IP$$ProtocolHandler {
  defaultPort:number = -1
  protocolFlags:number
    = Ci.nsIProtocolHandler.URI_LOADABLE_BY_SUBSUMERS
  scheme:string
  constructor(scheme:string) {
    this.scheme = scheme
  }
  allowPort(port:number, scheme:string) {
    return false
  }
  newURI(spec:string, charset:string, baseURI:null|nsIURI):nsIURI {
    dump(`IP$$ProtocolHandler<${this.scheme}>.newURI(${JSON.stringify(spec)}, ${JSON.stringify(charset)}, ${baseURI==null ? 'null' : baseURI.spec})\n`)

    if (baseURI === null || spec.startsWith(`${this.scheme}:`)) {
      const url = IP$$URL.parse(spec)
      if (url.scheme === this.scheme) {
        standardURL.init(Ci.nsIStandardURL.URLTYPE_STANDARD,
                          this.defaultPort,
                          IP$$URL.toBase16Encoded(url).toString(),
                          charset,
                          null)
      } else {
        throw Error(`Invalid spec was passed ${spec} for ${this.scheme} protocol handler`)
      }
    } else {
      standardURL.init(Ci.nsIStandardURL.URLTYPE_STANDARD,
                        this.defaultPort,
                        spec,
                        charset,
                        baseURI)
    }
    return standardURL.clone()
  }
  newChannel(uri:nsIURI):nsIChannel {
    return this.newChannel2(uri, null)
  }
  newChannel2(uri:nsIURI, loadInfo:null|nsILoadInfo):nsIChannel {
    dump(`IP$$ProtocolHandler<${this.scheme}>.newChannel2(${JSON.stringify(uri.spec)}, ${String(loadInfo)})\n`)
    const {scheme, id, path} = IP$$URL.toBaseEncodedV0(IP$$URL.parse(uri.spec))
    const spec = `http://localhost:8080/${scheme}/${id}${path}`
    const url = ioService.newURI(spec, uri.originCharset, null)
    const channel = ioService.newChannelFromURIWithLoadInfo(url, loadInfo)
    channel.originalURI = uri
    return channel
  }
  QueryInterface(iid:nsIIDRef):nsIProtocolHandler {
    if (iid.equals(Ci.nsIProtocolHandler) ||
        iid.equals(Ci.nsISupports)) {
      return this
    }
    dump(`!!! FSProtocolHandler.QueryInterface ${iid.name} ${iid.number}\n`)
    throw Cr.NS_ERROR_NO_INTERFACE
  }
}

export class Factory <nsQIResult> {
  instance: nsQIResult
  constructor(instance:nsQIResult) {
    this.instance = instance
  }
  createInstance(outer:null|nsISupports<*>, iid:nsIIDRef):nsQIResult {
    if (outer != null) {
      throw Cr.NS_ERROR_NO_AGGREGATION
    }

    return this.instance
  }
  lockFactory(lock:boolean):void {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED
  }
  QueryInterface(iid:nsIIDRef):Factory<nsQIResult> {
    if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIFactory)) {
      return this
    }
    dump(`!!! Factory.QueryInterface ${iid.name} ${iid.number}\n`)
    throw Cr.NS_ERROR_NO_INTERFACE
  }
}

export const main = () => {
  componentRegistrar.registerFactory(CID('{b6c93a47-778a-f643-b0c8-79f6be685e06}'),
                                    'FS protocol handler',
                                    '@mozilla.org/network/protocol;1?name=fs',
                                    new Factory(new FSProtocolHandler()))

  componentRegistrar.registerFactory(CID('{d0415967-75a1-4528-8030-b79d5552127d}'),
                                    'IPFS protocol handler',
                                    '@mozilla.org/network/protocol;1?name=ipfs',
                                    new Factory(new IP$$ProtocolHandler('ipfs')))

  componentRegistrar.registerFactory(CID('{f866a46c-2e79-44e6-929d-334fdf8a7fd7}'),
                                    'IPNS protocol handler',
                                    '@mozilla.org/network/protocol;1?name=ipns',
                                    new Factory(new IP$$ProtocolHandler('ipns')))

  componentRegistrar.registerFactory(CID('{8ef93514-306a-49a5-a9fa-f7a9c709b061}'),
                                    'IPDL protocol handler',
                                    '@mozilla.org/network/protocol;1?name=ipdl',
                                    new Factory(new IP$$ProtocolHandler('ipdl')))

  if (runtime.processType == Ci.nsIXULRuntime.PROCESS_TYPE_DEFAULT) {
    parentProcessMessageManager.
      loadProcessScript(`data:,Components.utils.import("${__URI__}", {}).main()`, true)
  }
}

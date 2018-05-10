/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIStandardURL.idl

import type {AUTF8String, long} from "../../xpcom/base/nsrootidl"
import type {nsIURI} from "./nsIURI"
import type {nsIURL} from "./nsIURL"

export type nsStandardURLType = long

export interface nsIStandardURLConstants {
  URLTYPE_STANDARD:long,
  URLTYPE_AUTHORITY:long,
  URLTYPE_NO_AUTHORITY:long
}

export interface nsIStandardURL extends nsIURL {
  mutable:boolean,
  init(urlType:nsStandardURLType, defaultPort:number, spec:string, originCharset:string, base:null|nsIURI):void
}

/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIURI.idl

import type {AUTF8String, ACString, long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"


export interface nsIURI extends nsISupports<nsIURI> {
  asciiHost:ACString,
  asciiHostPort:ACString,
  asciiSpec:ACString,
  hasRef:boolean,
  host:AUTF8String,
  hostPort:AUTF8String,
  originCharset:ACString,
  password:AUTF8String,
  path:AUTF8String,
  port:long,
  prePath:AUTF8String,
  ref:AUTF8String,
  scheme:ACString,
  spec:AUTF8String,
  specIgnoringRef:AUTF8String,
  username:AUTF8String,
  userPass:AUTF8String,
  filePath:AUTF8String,
  query:AUTF8String,
  clone():self,
  cloneIgnoringRef():self,
  cloneWithNewRef(newRef:AUTF8String):self,
  equals(other:nsIURI):boolean,
  equalsExceptRef(other:nsIURI):boolean,
  resolve(relativePath:AUTF8String):AUTF8String,
  schemeIs(scheme:string):boolean,
  setHostAndPort(hostport:AUTF8String):void
}

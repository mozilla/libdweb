/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/js/xpconnect/idl/xpcjsid.idl

import type {nsISupports} from "./nsISupports"

export interface nsIJSID extends nsISupports<nsIJSID> {
  name:string,
  number:string,
  valid:boolean,
  equals(other:nsIJSID):boolean,
  toString():string
}

export interface nsIJSIID extends nsIJSID {}

export interface nsIJSCID <nsQIResult> extends nsIJSID {
  createInstance(iid:?nsIJSID):nsQIResult,
  getService(iid:?nsIJSID):nsQIResult
}

// Export nsIJSID as nsIIDRef as well since that is what exposed to scriptable
// XPCOM.
export type nsIIDRef = nsIJSID
export type nsIDPtr = nsIJSID
export type nsCIDRef = nsIJSID
export type nsCIDPtr = nsIJSID

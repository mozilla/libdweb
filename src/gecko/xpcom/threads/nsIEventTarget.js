/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/threads/nsIEventTarget.idl

import type {AUTF8String, long, DOMString, PRTime} from "../base/nsrootidl"
import type {nsISupports} from "../base/nsISupports"

export type nsDispatchType = 0 | 1 | 2

export interface nsIEventTargetConstants {
  DISPATCH_NORMAL:nsDispatchType,
  DISPATCH_SYNC:nsDispatchType,
  DISPATCH_AT_END:nsDispatchType
}

export interface nsIEventTarget extends nsISupports<nsIEventTarget> {
  isOnCurrentThread():boolean
}

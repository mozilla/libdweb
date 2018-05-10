/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/base/nsISupports.idl

import type {nsIIDRef} from "./xpcjsid"

export interface nsISupports <nsQIResult> {
  QueryInterface(uuid:nsIIDRef):nsQIResult
}

export type {nsIIDRef}

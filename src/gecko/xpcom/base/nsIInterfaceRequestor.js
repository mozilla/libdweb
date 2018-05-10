/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/base/nsIInterfaceRequestor.idl

import type {nsISupports, nsIIDRef} from "./nsISupports"

export interface nsIInterfaceRequestor <nsQIResult> extends nsISupports<nsQIResult> {
  getInterface(uuid:nsIIDRef):nsQIResult
}

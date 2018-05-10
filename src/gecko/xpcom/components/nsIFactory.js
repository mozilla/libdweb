/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/components/nsIFactory.idl

import type {nsISupports, nsIIDRef} from "../base/nsISupports"

export interface nsIFactory <nsQIResult> extends nsISupports<nsIFactory<nsQIResult>> {
  createInstance(outer:null|nsISupports<*>, iid:nsIIDRef):nsQIResult,
  lockFactory(lock:boolean):void
}

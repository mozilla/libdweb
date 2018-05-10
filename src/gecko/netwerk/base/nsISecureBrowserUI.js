/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/netwerk/base/nsISecureBrowserUI.idl

import type {long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIDocShell} from "../../docshell/base/nsIDocShell"


export interface nsISecureBrowserUI extends nsISupports<nsISecureBrowserUI> {
  state:long,

  init(mozIDOMWindowProxy:typeof(window)):void,
  setDocShell(docShell:nsIDocShell):void,
}

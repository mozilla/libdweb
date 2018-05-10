/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIReflowObserver.idl

import type {DOMHighResTimeStamp} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"

export interface nsIReflowObserver extends nsISupports<nsIReflowObserver> {
  reflow(start:DOMHighResTimeStamp, end:DOMHighResTimeStamp):void,
  reflowInterruptible(start:DOMHighResTimeStamp, end:DOMHighResTimeStamp):void
}

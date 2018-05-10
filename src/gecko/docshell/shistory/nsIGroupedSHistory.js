/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/shistory/nsIPartialSHistory.idl

import type {long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIFrameLoader} from "../../dom/base/nsIFrameLoader"
import type {nsIPartialSHistory} from "./nsIPartialSHistory"

export interface nsIGroupedSHistory extends nsISupports<nsIGroupedSHistory> {
  count:long,
  activeFrameLoader:nsIFrameLoader,
  appendPartialSHistory(aPartialHistory:nsIPartialSHistory):void,
  handleSHistoryUpdate(aPartialHistory:nsIPartialSHistory, aTruncate:boolean):void,
  gotoIndex(aGlobalIndex:long):nsIFrameLoader,
  closeInactiveFrameLoaderOwners():void,
  addPrerenderingPartialSHistory(aPartialHistory:nsIPartialSHistory, aId:long):void,
  activatePrerendering(aId:long):nsISupports<*>,
  cancelPrerendering(aId:long):void
}

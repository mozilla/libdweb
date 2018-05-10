/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/shistory/nsIPartialSHistory.idl

import type {long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIFrameLoader} from "../../dom/base/nsIFrameLoader"
import type {nsIGroupedSHistory} from "./nsIGroupedSHistory"

type nsPartialSHistory = 0 | 1 | 2

export type nsIPartialSHistoryConstants = {
  STATE_INACTIVE:nsPartialSHistory,
  STATE_ACTIVE:nsPartialSHistory,
  STATE_PRERENDER:nsPartialSHistory
}

export interface nsIPartialSHistory extends nsISupports<nsIPartialSHistory> {
  count:long,
  globalIndex:long,
  globalIndexOffset:long,
  ownerFrameLoader:nsIFrameLoader,
  groupedSHistory:nsIGroupedSHistory,
  activeState:nsPartialSHistory,
  onAttachGroupedSHistory(aGroup:nsIGroupedSHistory, aOffset:long):void,
  handleSHistoryUpdate(aCount:long, aLocalIndex:long, aTruncate:boolean):void,
  onActive(aGlobalLength:long, aTargetLocalIndex:long):void,
  onDeactive():void
}

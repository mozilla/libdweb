/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/uriloader/base/nsIWebProgress.idl

import type {wstring, long, nsresult, uint64} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIWebProgressListener} from "./nsIWebProgressListener"

export type nsWebProgressState = long
export interface nsIWebProgressConstants {
  NOTIFY_STATE_REQUEST:nsWebProgressState,
  NOTIFY_STATE_DOCUMENT:nsWebProgressState,
  NOTIFY_STATE_NETWORK:nsWebProgressState,
  NOTIFY_STATE_WINDOW:nsWebProgressState,
  NOTIFY_STATE_ALL:nsWebProgressState,
  NOTIFY_PROGRESS:nsWebProgressState,
  NOTIFY_STATUS:nsWebProgressState,
  NOTIFY_SECURITY:nsWebProgressState,
  NOTIFY_LOCATION:nsWebProgressState,
  NOTIFY_REFRESH:nsWebProgressState,
  NOTIFY_ALL:nsWebProgressState
}

export interface nsIWebProgress extends nsISupports<nsIWebProgress> {
  mozIDOMWindowProxy: typeof window,
  DOMWindowID:uint64,
  isTopLevel:boolean,
  isLoadingDocument:boolean,
  loadType:long,

  addProgressListener(aListener:nsIWebProgressListener, aNotifyMask:long):void,
  removeProgressListener(aListener:nsIWebProgressListener):void,
}

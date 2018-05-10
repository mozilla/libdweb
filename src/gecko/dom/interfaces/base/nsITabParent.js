/* @flow */

// See:https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/dom/interfaces/base/nsITabParent.idl

import type {long, uint32, uint64} from "../../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../../xpcom/base/nsISupports"

export interface nsITabParent extends nsISupports<nsITabParent> {
  useAsyncPanZoom:boolean,
  isPrerendered:boolean,
  tabId:uint64,
  osPid:uint32,
  hasContentOpener:boolean,

  getChildProcessOffset(aCssX:uint32, aCssY:uint32):void,
  preserveLayers(aPreserveLayers:boolean):void,
  suppressDisplayport(aEnabled:boolean):void,
  navigateByKey(aForward:boolean, aForDocumentNavigation:boolean):void
}

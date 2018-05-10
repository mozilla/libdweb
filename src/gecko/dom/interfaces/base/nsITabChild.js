/* @flow */

// See:https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/dom/interfaces/base/nsITabChild.idl

import type {long, uint32, uint64} from "../../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../../xpcom/base/nsISupports"
import type {nsIContentFrameMessageManager} from "../../../dom/base/nsIMessageManager"
import type {nsIWebBrowserChrome3} from "../../../embedding/browser/nsIWebBrowserChrome3"

export interface nsITabChild extends nsISupports<nsITabChild> {
  tabId:uint64,
  messageManager:nsIContentFrameMessageManager,
  webBrowserChrome:nsIWebBrowserChrome3,
  sendRequestFocus(canFocus:boolean):void,
  sendGetTabCount(tabCount:uint32):void,

}

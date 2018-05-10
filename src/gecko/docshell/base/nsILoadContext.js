/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsILoadContext.idl

import type {long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"

type mozIDOMWindowProxy = typeof window

export interface nsILoadContext extends nsISupports<nsILoadContext> {
  associatedWindow: mozIDOMWindowProxy,
  topWindow: mozIDOMWindowProxy,
  topFrameElement: Element,
  nestedFrameId: long,
  isContent:boolean,
  usePrivateBrowsing:boolean,
  useRemoteTabs:boolean,
  isInIsolatedMozBrowserElement:boolean,
  originAttributes:Object
}

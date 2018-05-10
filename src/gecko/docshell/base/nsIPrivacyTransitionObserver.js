/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIPrivacyTransitionObserver.idl

import type {nsISupports} from "../../xpcom/base/nsISupports"

export interface nsIPrivacyTransitionObserver extends nsISupports<nsIPrivacyTransitionObserver> {
  privateModeChanged(enabled:boolean):void
}

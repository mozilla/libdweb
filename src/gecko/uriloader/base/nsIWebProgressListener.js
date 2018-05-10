/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/uriloader/base/nsIWebProgressListener.idl

import type {wstring, long, nsresult} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIRequest} from "../../netwerk/base/nsIRequest"
import type {nsIURI} from "../../netwerk/base/nsIURI"
import type {nsIWebProgress} from "./nsIWebProgress"

export type nsWebProgressState = long
export interface nsIWebProgressListenerConstants {
  // State Transition Flags
  STATE_START:nsWebProgressState,
  STATE_REDIRECTING:nsWebProgressState,
  STATE_TRANSFERRING:nsWebProgressState,
  STATE_NEGOTIATING:nsWebProgressState,
  STATE_STOP:nsWebProgressState,
  // State Type Flags
  STATE_IS_REQUEST:nsWebProgressState,
  STATE_IS_DOCUMEN:nsWebProgressState,
  STATE_IS_NETWORK:nsWebProgressState,
  STATE_IS_WINDOW:nsWebProgressState,
  // State Modifier Flags
  STATE_RESTORING:nsWebProgressState,
  // State Security Flags
  STATE_IS_INSECURE:nsWebProgressState,
  STATE_IS_BROKEN:nsWebProgressState,
  STATE_IS_SECURE:nsWebProgressState,
  // Mixed active content flags
  STATE_BLOCKED_MIXED_ACTIVE_CONTENT:nsWebProgressState,
  STATE_LOADED_MIXED_ACTIVE_CONTENT:nsWebProgressState,
  // Mixed display content flags
   STATE_BLOCKED_MIXED_DISPLAY_CONTEN:nsWebProgressState,
  STATE_LOADED_MIXED_DISPLAY_CONTENT:nsWebProgressState,
  // Tracking content flags
  STATE_BLOCKED_TRACKING_CONTENT:nsWebProgressState,
  STATE_LOADED_TRACKING_CONTENT:nsWebProgressState,
  // Security Strength Flags
  STATE_SECURE_HIGH:nsWebProgressState,
  STATE_SECURE_MED:nsWebProgressState,
  STATE_SECURE_LOW:nsWebProgressState,
  //
  STATE_IDENTITY_EV_TOPLEVEL:nsWebProgressState,
  //  Broken state flags
  STATE_USES_SSL_3:nsWebProgressState,
  STATE_USES_WEAK_CRYPTO:nsWebProgressState,
  STATE_CERT_USER_OVERRIDDEN:nsWebProgressState,

  LOCATION_CHANGE_SAME_DOCUMEN:nsWebProgressState,
  LOCATION_CHANGE_ERROR_PAGE:nsWebProgressState
}

export interface nsIWebProgressListener extends nsISupports<nsIWebProgressListener> {
  onStateChange(aWebProgress:nsIWebProgress,
                aRequest:nsIRequest,
                aStateFlags:nsWebProgressState,
                aStatus:nsresult):void,
  onProgressChange(aWebProgress:nsIWebProgress,
                    aRequest:nsIRequest,
                    aCurSelfProgress:long,
                    aMaxSelfProgress:long,
                    aCurTotalProgress:long,
                    aMaxTotalProgress:long):void,
  onLocationChange(aWebProgress:nsIWebProgress,
                    aRequest:nsIRequest,
                    aLocation:nsIURI,
                    aFlags?:nsWebProgressState):void,
  onStatusChange(aWebProgress:nsIWebProgress,
                  aRequest:nsIRequest,
                  aStatus:nsresult,
                  aMessage:wstring):void,
  onSecurityChange(aWebProgress:nsIWebProgress,
                    aRequest:nsIRequest,
                    aState:nsWebProgressState):void
}

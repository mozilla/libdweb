/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIRequestObserver.idl

import type {nsIRequest} from "./nsIRequest"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsresult} from "../../xpcom/base/nsrootidl"

export interface nsIRequestObserver extends nsISupports<nsIRequestObserver> {
  // Called to signify the beginning of an asynchronous request.
  // Note: An exception thrown from onStartRequest has the side-effect of causing the request to be canceled.
  onStartRequest(request:nsIRequest, context:nsISupports<*>):void,
  // Called to signify the end of an asynchronous request. This call is always
  // preceded by a call to onStartRequest().
  // Note: An exception thrown from onStopRequest is generally ignored.
  onStopRequest(request:nsIRequest, context:nsISupports<*>, status:nsresult):void
}

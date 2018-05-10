/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIAsyncVerifyRedirectCallback.idl

import type {nsresult} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"

export interface nsIAsyncVerifyRedirectCallback extends nsISupports<nsIAsyncVerifyRedirectCallback> {
  // Complement to nsIChannelEventSink asynchronous callback. The result of
  // the redirect decision is passed through this callback.
  // result is Result of the redirect veto decision. If FAILED the redirect
  // has been vetoed. If SUCCEEDED the redirect has been allowed by all
  // consumers.
  onRedirectVerifyCallback(result:nsresult):void
}

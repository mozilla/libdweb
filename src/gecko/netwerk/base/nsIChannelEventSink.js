/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIChannelEventSink.idl

import type {long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIChannel} from "./nsIChannel"
import type {nsIAsyncVerifyRedirectCallback} from "./nsIAsyncVerifyRedirectCallback"


export interface nsIChannelEventSinkConstants {
  REDIRECT_TEMPORARY:long,
  REDIRECT_PERMANENT:long,
  REDIRECT_INTERNAL:long,
  REDIRECT_STS_UPGRADE:long,
}

export interface nsIChannelEventSink extends nsISupports <nsIChannelEventSink> {
  asyncOnChannelRedirect(oldChannel:nsIChannel,
                          newChannel:nsIChannel,
                          flags:long,
                          callback:nsIAsyncVerifyRedirectCallback):void
}

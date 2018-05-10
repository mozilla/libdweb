/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIStreamListener.idl

import type {nsIRequestObserver} from "./nsIRequestObserver"
import type {nsIRequest} from "./nsIRequest"
import type {nsIInputStream} from "../../xpcom/io/nsIInputStream"
import type {nsISupports} from "../../xpcom/base/nsISupports"



export interface nsIStreamListener extends nsIRequestObserver  {
  onDataAvailable(request:nsIRequest,
                  context:nsISupports<*>,
                  inputStream:nsIInputStream,
                  offset:number,
                  count:number):void
}

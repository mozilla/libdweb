/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/socket/nsITransportSecurityInfo.idl

import type {wstring, long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"

export interface nsITransportSecurityInfo extends nsISupports<nsITransportSecurityInfo> {
  securityState: long,
  errorMessage: wstring,
  errorCode: long
}

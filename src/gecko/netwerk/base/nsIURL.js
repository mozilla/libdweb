/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIURL.idl

import type {AUTF8String} from "../../xpcom/base/nsrootidl"
import type {nsIURI} from "./nsIURI"


export interface nsIURL extends nsIURI {
  directory:AUTF8String,
  fileName:AUTF8String,
  fileBaseName:AUTF8String,
  fileExtension:AUTF8String,
  getCommonBaseSpec(other:nsIURI):AUTF8String,
  getRelativeSpec(other:nsIURI):AUTF8String
}

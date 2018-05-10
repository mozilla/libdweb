/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/base/nsIUUIDGenerator.idl

import type {nsIDPtr} from "./xpcjsid"
import type {nsISupports} from "./nsISupports"

export interface nsIUUIDGenerator extends nsISupports<nsIUUIDGenerator> {
  generateUUID():nsIDPtr
}

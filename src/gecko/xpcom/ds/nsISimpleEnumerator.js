/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/io/nsIFile.idl

import type {nsISupports} from "../base/nsISupports"

export interface nsISimpleEnumerator<nsQIResult> extends nsISupports<nsISimpleEnumerator<nsQIResult>> {
  hasMoreElements():boolean,
  getNext():nsISupports<nsQIResult>
}

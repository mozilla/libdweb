/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/base/nsIMutable.idl

import type {nsISupports} from "./nsISupports"

export interface nsIMutable extends nsISupports<nsIMutable> {
  mutable:boolean
}

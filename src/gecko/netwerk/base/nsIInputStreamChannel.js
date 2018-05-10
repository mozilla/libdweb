/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/netwerk/base/nsIInputStreamChannel.idl

import type {AString, long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIURI} from "./nsIURI"
import type {nsIInputStream} from "../../xpcom/io/nsIInputStream"

export interface nsIInputStreamChannel extends nsISupports<nsIInputStreamChannel> {
  contentStream:nsIInputStream,
  srcdocData:AString,
  isSrcdocChannel:boolean,
  baseURI:nsIURI,

  setURI(aURI:nsIURI):void
}

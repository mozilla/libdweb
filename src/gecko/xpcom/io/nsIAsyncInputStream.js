/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIAsyncInputStream.idl

import type {nsISupports} from "../base/nsISupports"
import type {nsIInputStream} from "./nsIInputStream"
import type {long, nsresult} from "../../xpcom/base/nsrootidl"
import type {nsIEventTarget} from "../../xpcom/threads/nsIEventTarget"

export interface nsIInputStreamCallback extends nsISupports<nsIInputStreamCallback> {
  onInputStreamReady(aStream:nsIAsyncInputStream):void
}

export interface nsIAsyncInputStreamConstants {
  WAIT_CLOSURE_ONLY:long
}

export interface nsIAsyncInputStream extends nsIInputStream {
  // This method closes the stream and sets its internal status.  If the
  // stream is already closed, then this method is ignored.  Once the stream
  // is closed, the stream's status cannot be changed.  Any successful status
  // code passed to this method is treated as NS_BASE_STREAM_CLOSED, which
  // has an effect equivalent to nsIInputStream::close.
  closeWithStatus(aStatus:nsresult):void,
  asyncWait(aCallback:nsIInputStreamCallback,
            aFlags:long ,
            aRequestedCount:long,
            aEventTarget:nsIEventTarget):void
}

/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/io/nsIInputStream.idl

import type {nsISupports} from "../base/nsISupports"

export interface nsIInputStream extends nsISupports<nsIInputStream> {
  // Determine number of bytes available in the stream.

  // In addition to the number of bytes available in the stream, this method
  // also informs the caller of the current status of the stream. A stream that
  // is closed will throw an exception when this method is called. That enables
  // the caller to know the condition of the stream before attempting to read
  // from it. If a stream is at end-of-file, but not closed, then this method
  // returns 0 bytes available.
  //
  // Note: Some nsIInputStream implementations automatically close() when
  // end-of-file is reached; others do not.
  //
  // Note: This method should not be used to determine the total size of a
  // stream, even if the stream corresponds to a local file. Moreover, since a
  // stream may make available more than 2^32 bytes of data, this method is
  // incapable of expressing the entire size of the underlying data source.
  available():number,
  // Close the stream. This method causes subsequent calls to read() and
  // readSegments() to return 0 bytes read to indicate end-of-file.
  //
  // Note: The close method may be called more than once, but subsequent calls
  // are ignored.
  close():void,
  // Returns true if stream is non-blocking.
  isNonBlocking():boolean,
}

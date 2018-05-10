/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIOutputStream.idl

import type {long} from "../base/nsrootidl"
import type {nsISupports} from "../base/nsISupports"
import type {nsIInputStream} from "./nsIInputStream"

export interface nsIOutputStream extends nsISupports<nsIOutputStream> {
  // Close the stream. Forces the output stream to flush any buffered data.
  // Throws `NS_BASE_STREAM_WOULD_BLOCK` if unable to flush without blocking
  // the calling thread (non-blocking mode only)
  close():void,
  // Flush the stream.
  // Throws `NS_BASE_STREAM_WOULD_BLOCK` if unable to flush without blocking
  // the calling thread (non-blocking mode only).
  flush():void,
  // Write data into the stream.
  //
  // @param aBuf the buffer containing the data to be written
  // @param aCount the maximum number of bytes to be written
  //
  // @return number of bytes written (may be less than aCount)
  //
  // @throws NS_BASE_STREAM_WOULD_BLOCK if writing to the output stream would
  // block the calling thread (non-blocking mode only)
  // @throws <other-error> on failure
  write(aBuf:string, aCount:long):long,
  // Writes data into the stream from an input stream.
  //
  // @param aFromStream the stream containing the data to be written
  // @param aCount the maximum number of bytes to be written
  //
  // @return number of bytes written (may be less than aCount)
  //
  // @throws NS_BASE_STREAM_WOULD_BLOCK if writing to the output stream would
  // block the calling thread (non-blocking mode only). This failure
  // means no bytes were transferred.
  // @throws <other-error> on failure
  //
  // NOTE: This method is defined by this interface in order to allow the
  // output stream to efficiently copy the data from the input stream into
  // its internal buffer (if any). If this method was provided as an external
  // facility, a separate char* buffer would need to be used in order to call
  // the output stream's other Write method.
  writeFrom(aFromStream:nsIInputStream, aCount:long):long,
  // @return true if stream is non-blocking
  //
  // NOTE: writing to a blocking output stream will block the calling thread
  // until all given data can be consumed by the stream.
  //
  // NOTE: a non-blocking output stream may implement nsIAsyncOutputStream to
  // provide consumers with a way to wait for the stream to accept more data
  // once its write method is unable to accept any data without blocking.
  isNonBlocking():boolean
}

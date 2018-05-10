/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/io/nsIScriptableInputStream.idl

import type {nsISupports} from "../base/nsISupports"
import type {nsIInputStream} from "./nsIInputStream"
import type {ACString} from "../../xpcom/base/nsrootidl"

export interface nsIScriptableInputStream extends nsIInputStream {
  // Wrap the given nsIInputStream with this nsIScriptableInputStream.
  // Note: The init method may be called more than once, allowing a
  // nsIScriptableInputStream instance to be reused.
  init(inputStream:nsIInputStream):void,
  // Read data from the stream.
  // Warning: If the data contains a null byte, then this method will return a
  // truncated string.
  // returns a string, which will be an empty string if the stream is at EOF.
  // Throws exception:
  //  - NS_ERROR_NOT_INITIALIZED
  //    If init() was not called.
  //  - NS_BASE_STREAM_CLOSED
  //    If called after the stream has been closed.
  //  - NS_BASE_STREAM_WOULD_BLOCK
  //    Indicates that reading from the input stream would block the calling
  //    thread for an indeterminate amount of time. This exception may only be
  //    thrown if nsIInputStream.isNonBlocking() returns true.
  read(count:number):string,
  // Read data from the stream, including null bytes.
  // Throws exception:
  //  - NS_ERROR_FAILURE
  //    If there are not enough bytes available to read aCount amount of data.
  //  - NS_BASE_STREAM_WOULD_BLOCK
  //    Indicates that reading from the input stream would block the calling
  //    thread for an indeterminate amount of time. This exception may only be
  //    thrown if nsIInputStream.isNonBlocking() returns true.
  readByte(count:number):ACString
}

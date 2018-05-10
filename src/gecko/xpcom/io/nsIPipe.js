/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIPipe.idl

import type {nsISupports} from "../base/nsISupports"
import type {nsIAsyncInputStream} from "./nsIAsyncInputStream"
import type {nsIAsyncOutputStream} from "./nsIAsyncOutputStream"
import type {long} from "../../xpcom/base/nsrootidl"

export interface nsIPipe extends nsISupports<nsIPipe> {
  init(nonBlockingInput:boolean,
        nonBlockingOutput:boolean,
        segmentSize:long,
        segmentCount:long):void,
  inputStream:nsIAsyncInputStream,
  outputStream:nsIAsyncOutputStream,
}

/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/io/nsIScriptableInputStream.idl

import type {nsISupports} from "../base/nsISupports"
import type {nsIInputStream} from "./nsIInputStream"
import type {ACString, AString, uint8, uint16, uint32, uint64, double, float} from "../../xpcom/base/nsrootidl"

export interface nsIBinaryInputStream extends nsIInputStream {
  setInputStream(inputStream:nsIInputStream):void,
  read8():uint8,
  read16():uint16,
  read32():uint32,
  read64():uint64,
  readBoolean():boolean,
  readByteArray(length:number):Array<uint8>,
  readBytes(length:number):string,
  readCString():ACString,
  readDouble():double,
  readFloat():float,
  readString():AString
}

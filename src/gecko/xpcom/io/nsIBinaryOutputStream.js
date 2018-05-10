/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIBinaryOutputStream.idl

import type {nsISupports} from "../base/nsISupports"
import type {nsIOutputStream} from "./nsIOutputStream"
import type {wstring, uint8, uint16, uint32, uint64, double, float} from "../../xpcom/base/nsrootidl"

export interface nsIBinaryOutputStream extends nsIOutputStream {
  setOutputStream(aOutputStream:nsIOutputStream):void,
  writeBoolean(aBoolean:boolean):void,
  write8(aByte:uint8):void,
  write16(a16:uint16):void,
  write32(a32:uint32):void,
  write64(a64:uint64):void,
  writeFloat(aFloat:float):void,
  writeDouble(aDouble:double):void,
  writeStringZ(aString:string):void,
  writeWStringZ(aString:wstring):void,
  writeUtf8Z(aString:wstring):void,
  writeBytes(aString:string, aLength:uint32):void,
  writeByteArray(aBytes:Array<uint8>, aLength:uint32):void
}

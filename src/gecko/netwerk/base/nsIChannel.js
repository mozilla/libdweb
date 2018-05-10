/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIChannel.idl

import type {ACString, uint64, long, AString} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIInterfaceRequestor} from "../../xpcom/base/nsIInterfaceRequestor"
import type {nsITransportSecurityInfo} from "../socket/nsITransportSecurityInfo"
import type {nsIChannelEventSink} from "./nsIChannelEventSink"
import type {nsIStreamListener} from "./nsIStreamListener"
import type {nsIRequest} from "./nsIRequest"
import type {nsIURI} from "./nsIURI"
import type {nsILoadInfo} from "./nsILoadInfo"
import type {nsIInputStream} from "../../xpcom/io/nsIInputStream"

export interface nsIChannelConstants {
  LOAD_DOCUMENT_URI:long,
  LOAD_RETARGETED_DOCUMENT_URI:long,
  LOAD_REPLACE:long,
  LOAD_INITIAL_DOCUMENT_URI:long,
  LOAD_TARGETED:long,
  LOAD_CALL_CONTENT_SNIFFERS:long,
  LOAD_CLASSIFY_URI:long,
  LOAD_MEDIA_SNIFFER_OVERRIDES_CONTENT_TYPE:long,
  LOAD_EXPLICIT_CREDENTIALS:long,
  LOAD_BYPASS_SERVICE_WORKER:long,
  DISPOSITION_INLINE: long,
  DISPOSITION_ATTACHMENT: long
}

export interface nsIChannel extends nsIRequest {
  contentCharset:ACString,
  contentLength:uint64,
  contentType:ACString,
  contentDisposition:long,
  contentDispositionFilename:AString,
  contentDispositionHeader:ACString,
  loadInfo: nsILoadInfo,
  notificationCallbacks:nsIInterfaceRequestor<nsIChannelEventSink> | null,
  originalURI:nsIURI,
  owner:nsISupports<*> | null,
  securityInfo: null |  nsITransportSecurityInfo,
  URI: nsIURI,
  asyncOpen(listener: nsIStreamListener, context:nsISupports<*>):void,
  asyncOpen2(listener: nsIStreamListener):void,
  open():nsIInputStream,
  open2():nsIInputStream
}

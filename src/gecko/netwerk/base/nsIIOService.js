/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIIOService.idl

import type {nsresult, AUTF8String, ACString, long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIURI} from "./nsIURI"
import type {nsIChannel} from "./nsIChannel"
import type {nsIProtocolHandler} from "./nsIProtocolHandler"
import type {nsIFile} from "../../xpcom/io/nsIFile"
import type {nsIPrincipal} from "../../caps/nsIPrincipal"
import type {nsILoadInfo} from "../../netwerk/base/nsILoadInfo"

export interface nsIIOService extends nsISupports<nsIIOService> {
  getProtocolHandler(scheme:string):nsIProtocolHandler,
  getProtocolFlags(aScheme:string):long,
  newURI(aSpec:AUTF8String, aOriginCharset:string, aBaseURI:null|nsIURI):nsIURI,
  newFileURI(aFile:nsIFile):nsIURI,
  newChannelFromURI(aURI:nsIURI):nsIURI,
  newChannelFromURI2(aURI:nsIURI,
                      aLoadingNode:null|Node,
                      aLoadingPrincipal:null|nsIPrincipal,
                      aTriggeringPrincipal:null|nsIPrincipal,
                      aSecurityFlags:null|long,
                      aContentPolicyType:null|long):nsIChannel,
  newChannelFromURIWithLoadInfo(aURI:nsIURI, aLoadInfo:null|nsILoadInfo):nsIChannel,
  newChannel(spec:AUTF8String,
              aOriginCharset:string,
              baseURI:null|nsIURI):nsIChannel,
  newChannel2(spec:AUTF8String,
              aOriginCharset:string,
              baseURI:null|nsIURI,
              aLoadingNode:null|Node,
              aLoadingPrincipal:null|nsIPrincipal,
              aTriggeringPrincipal:null|nsIPrincipal,
              aSecurityFlags:null|long,
              aContentPolicyType:null|long):nsIChannel,
  offline:boolean,
  connectivity:boolean,
  allowPort(aPort:long, aScheme:string):boolean,
  extractScheme(urlString:AUTF8String):ACString
}

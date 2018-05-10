/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/caps/nsIScriptSecurityManager.idl

import type {AString, ACString, AUTF8String, long} from "../xpcom/base/nsrootidl"
import type {nsISupports} from "../xpcom/base/nsISupports"
import type {nsIURI} from "../netwerk/base/nsIURI"
import type {nsIPrincipal} from "./nsIPrincipal"
import type {nsILoadContext} from "../docshell/base/nsILoadContext"
import type {nsIDocShell} from "../docshell/base/nsIDocShell"
import type {nsIChannel} from "../netwerk/base/nsIChannel"
import type {nsIDomainPolicy} from "./nsIDomainPolicy"

export interface nsIScriptSecurityManagerConstants {
  NO_APP_ID:long,
  UNKNOWN_APP_ID:long,
  SAFEBROWSING_APP_ID:long,
  DEFAULT_USER_CONTEXT_ID:long,

}


export interface nsIScriptSecurityManager extends nsISupports<nsIScriptSecurityManager> {
  checkLoadURIWithPrincipal(aPrincipal:nsIPrincipal,
                            uri:nsIURI,
                            flags:long):void,
  checkLoadURIStrWithPrincipal(aPrincipal:nsIPrincipal,
                                uri:AUTF8String,
                                flags:long):void,
  getSystemPrincipal():nsIPrincipal,
  getLoadContextCodebasePrincipal(uri:nsIURI, loadContext:nsILoadContext):nsIPrincipal,
  getDocShellCodebasePrincipal(uri:nsIURI, docShell:nsIDocShell):nsIPrincipal,
  createCodebasePrincipal(uri:nsIURI, originAttributes:Object):nsIPrincipal,
  createCodebasePrincipalFromOrigin(origin:ACString):nsIPrincipal,
  createNullPrincipal(originAttributes:Object):nsIPrincipal,
  createExpandedPrincipal(aPrincipalArray:Array<nsIPrincipal>):nsIPrincipal,
  checkSameOriginURI(aSourceURI:nsIURI, aTargetURI:nsIURI, reportError:boolean):void,
  getChannelResultPrincipal(aChannel:nsIChannel):nsIPrincipal,
  getChannelURIPrincipal(aChannel:nsIChannel):nsIPrincipal,
  isSystemPrincipal(aPrincipal:nsIPrincipal):boolean,
  getJarPrefix(appId:long, inMozBrowser:boolean):AUTF8String,
  activateDomainPolicy():nsIDomainPolicy,
  domainPolicyActive:boolean,
  policyAllowsScript(aDomain:nsIURI):boolean
}

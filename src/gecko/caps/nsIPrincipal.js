/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/caps/nsIPrincipal.idl

import type {AString, ACString, AUTF8String} from "../xpcom/base/nsrootidl"
import type {nsISupports} from "../xpcom/base/nsISupports"
import type {nsIURI} from "../netwerk/base/nsIURI"

export interface nsIPrincipalContstants {
  APP_STATUS_NOT_INSTALLED:number,
  APP_STATUS_INSTALLED:number,
  APP_STATUS_PRIVILEGED:number,
  APP_STATUS_CERTIFIED:number
}

export interface nsIExpandedPrincipal extends nsISupports<nsIPrincipal> {
  whiteList: Array<nsIPrincipal>
}

export interface nsIPrincipal extends nsISupports<nsIPrincipal> {
  equals(other:nsIPrincipal):boolean,
  equalsConsideringDomain(other:nsIPrincipal):boolean,
  URI:nsIURI,
  subsumes(other:nsIPrincipal):boolean,
  subsumesConsideringDomain(other:nsIPrincipal):boolean,
  checkMayLoad(uri:nsIURI, report:boolean, allowIfInheritsPrincipal:boolean):boolean,
  cspJSON:AString,
  origin:ACString,
  originNoSuffix:ACString,
  originSuffix:AUTF8String,
  baseDomain:ACString,

}

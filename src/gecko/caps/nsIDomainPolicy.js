/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/caps/nsIDomainPolicy.idl

import type {AString, ACString, AUTF8String} from "../xpcom/base/nsrootidl"
import type {nsISupports} from "../xpcom/base/nsISupports"
import type {nsIURI} from "../netwerk/base/nsIURI"

export interface nsIDomainSet extends nsISupports<nsIDomainSet> {
  add(aDomain:nsIURI):void,
  remove(aDomain:nsIURI):void,
  clear():void,
  contains(aDomain:nsIURI):boolean,
  containsSuperDomain(aDomain:nsIURI):boolean
}

export interface nsIDomainPolicy extends nsISupports<nsIDomainPolicy> {
  blacklist:nsIDomainSet,
  superBlacklist:nsIDomainSet,
  whitelist:nsIDomainSet,
  superWhitelist:nsIDomainSet,

  deactivate():void
}

/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/components/nsIComponentManager.idl


import type {nsCIDPtr, nsCIDRef} from "../base/xpcjsid"
import type {nsISupports, nsIIDRef} from "../base/nsISupports"
import type {nsIFactory} from "./nsIFactory"
import type {nsIFile} from "../io/nsIFile"
import type {nsISimpleEnumerator} from "../ds/nsISimpleEnumerator"

export interface nsIComponentRegistrar extends nsISupports<nsIComponentRegistrar> {
  autoRegister(spec:nsIFile):void,
  autoUnregister(spec:nsIFile):void,
  registerFactory(aClass:nsCIDRef,
                  aClassName:string,
                  aContractID:string,
                  aFactory:nsIFactory<*>):void,
  unregisterFactory(aClass:nsCIDRef, aFactory:nsIFactory<*>):void,
  isCIDRegistered(aClass:nsCIDRef):boolean,
  isContractIDRegistered(aContractID:string):boolean,
  enumerateCIDs():nsISimpleEnumerator<nsCIDRef>,
  enumerateContractIDs():nsISimpleEnumerator<string>,
  contractIDToCID(aContractID:string):nsCIDPtr
}

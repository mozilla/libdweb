/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/components/nsIComponentManager.idl

import type {nsCIDRef} from "../base/xpcjsid"
import type {nsISupports, nsIIDRef} from "../base/nsISupports"
import type {nsIFile} from "../io/nsIFile"
import type {nsISimpleEnumerator} from "../ds/nsISimpleEnumerator"
import type {nsIComponentRegistrar} from "./nsIComponentRegistrar"

export interface nsIComponentManager extends nsISupports<nsIComponentRegistrar & nsIComponentManager> {
  getClassObject <nsQIResult> (aClass:nsCIDRef, iid:nsIIDRef):nsQIResult,
  getClassObjectByContractID <nsQIResult> (aContractID:string,
                                            aIID:nsIIDRef):nsQIResult,
  createInstance <nsQIResult> (aClass:nsCIDRef,
                                aDelegate:nsISupports<*>,
                                aIID:nsIIDRef):nsQIResult,
  createInstanceByContractID <nsQIResult> (aContractID:string,
                                            aDelegate:nsISupports<*>,
                                            aIID:nsIIDRef):nsQIResult,
  addBootstrappedManifestLocation(aLocation:nsIFile):void,
  removeBootstrappedManifestLocation(aLocation:nsIFile):void,
  getManifestLocations():nsISimpleEnumerator<nsIFile>
}

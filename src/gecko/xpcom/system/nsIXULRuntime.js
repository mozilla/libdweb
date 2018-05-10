/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/system/nsIXULRuntime.idl

import type {AUTF8String, long, DOMString, PRTime} from "../base/nsrootidl"
import type {nsISupports} from "../base/nsISupports"

export type nsProcessType =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5

export interface nsIXULRuntimeConstants {
  PROCESS_TYPE_DEFAULT:nsProcessType,
  PROCESS_TYPE_PLUGIN:nsProcessType,
  PROCESS_TYPE_CONTENT:nsProcessType,
  PROCESS_TYPE_IPDLUNITTEST:nsProcessType,
  PROCESS_TYPE_GMPLUGIN:nsProcessType,
  PROCESS_TYPE_GPU:nsProcessType,


}

export interface nsIXULRuntime extends nsISupports<nsIXULRuntime> {
  inSafeMode:boolean,
  logConsoleErrors:boolean,
  OS:AUTF8String,
  XPCOMABI:AUTF8String,
  widgetToolkit:AUTF8String,
  processType:nsProcessType,
  processID:long,
  uniqueProcessID:long,
  remoteType:DOMString,
  browserTabsRemoteAutostart:boolean,
  multiprocessBlockPolicy:long,
  accessibilityEnabled:boolean,
  is64Bit:boolean,
  replacedLockTime:PRTime,
  lastRunCrashID:DOMString,
  isReleaseOrBeta:boolean,
  isOfficialBranding:boolean,
  defaultUpdateChannel:AUTF8String,
  distributionID:AUTF8String,
  isOfficial:boolean,
  windowsDLLBlocklistStatus:boolean,

  invalidateCachesOnRestart():void,
  ensureContentProcess():void
}

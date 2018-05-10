/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIDocShellTreeItem.idl

import type {wstring, AString, long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIPrincipal} from "../../caps/nsIPrincipal"
import type {nsIURI} from "../../netwerk/base/nsIURI"
import type {nsIDocShell} from "./nsIDocShell"
import type {nsIInputStream} from "../../xpcom/io/nsIInputStream"
import type {nsISHEntry} from "../../docshell/shistory/nsISHEntry"

export type nsDocShellInfoLoadType =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20

export type nsDocShellInfoReferrerPolicy = long

export interface nsIDocShellLoadInfoConstants {
  loadNormal:nsDocShellInfoLoadType,                     // Normal Load
  loadNormalReplace:nsDocShellInfoLoadType,              // Normal Load but replaces current history slot
  loadHistory:nsDocShellInfoLoadType,                    // Load from history
  loadReloadNormal:nsDocShellInfoLoadType,               // Reload
  loadReloadBypassCache:nsDocShellInfoLoadType,
  loadReloadBypassProxy:nsDocShellInfoLoadType,
  loadReloadBypassProxyAndCache:nsDocShellInfoLoadType,
  loadLink:nsDocShellInfoLoadType,
  loadRefresh:nsDocShellInfoLoadType,
  loadReloadCharsetChange:nsDocShellInfoLoadType,
  loadBypassHistory:nsDocShellInfoLoadType,
  loadStopContent:nsDocShellInfoLoadType,
  loadStopContentAndReplace:nsDocShellInfoLoadType,
  loadNormalExternal:nsDocShellInfoLoadType,
  loadNormalBypassCache:nsDocShellInfoLoadType,
  loadNormalBypassProxy:nsDocShellInfoLoadType,
  loadNormalBypassProxyAndCache:nsDocShellInfoLoadType,
  loadPushState:nsDocShellInfoLoadType,                 // history.pushState or replaceState
  loadReplaceBypassCache:nsDocShellInfoLoadType,
  loadReloadMixedContent:nsDocShellInfoLoadType,
  loadNormalAllowMixedContent:nsDocShellInfoLoadType
}

export interface nsIDocShellLoadInfo extends nsISupports<nsIDocShellLoadInfo> {
  referrer:nsIURI,
  originalURI:nsIURI,
  loadReplace:boolean,
  triggeringPrincipal:nsIPrincipal,
  inheritPrincipal:boolean,
  principalIsExplicit:boolean,
  loadType:nsDocShellInfoLoadType,
  SHEntry:nsISHEntry,
  target:wstring,
  postDataStream:nsIInputStream,
  sendReferrer:boolean,
  referrerPolicy:nsDocShellInfoReferrerPolicy,
  isSrcdocLoad:boolean,
  srcdocData:AString,
  sourceDocShell:nsIDocShell,
  baseURI:nsIURI
}

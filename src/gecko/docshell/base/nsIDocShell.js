/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIDocShell.idl

import type {ACString, AString, DOMString, DOMHighResTimeStamp, long, float, wstring, nsresult} from "../../xpcom/base/nsrootidl"
import type {nsIDPtr} from "../../xpcom/base/xpcjsid"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIPrincipal} from "../../caps/nsIPrincipal"
import type {nsIURI} from "../../netwerk/base/nsIURI"
import type {nsIDocShellTreeItem} from "./nsIDocShellTreeItem"
import type {nsITabParent} from "../../dom/interfaces/base/nsITabParent"
import type {nsIDocShellLoadInfo} from "./nsIDocShellLoadInfo"
import type {nsISimpleEnumerator} from "../../xpcom/ds/nsISimpleEnumerator"
import type {nsIChannel} from "../../netwerk/base/nsIChannel"
import type {nsISHEntry} from "../../docshell/shistory/nsISHEntry"
import type {nsIContentViewer} from "./nsIContentViewer"
import type {nsIReflowObserver} from "./nsIReflowObserver"
import type {nsIDOMEventTarget} from "../../dom/interfaces/events/nsIDOMEventTarget"
import type {nsISecureBrowserUI} from "../../netwerk/base/nsISecureBrowserUI"
import type {nsIWebBrowserPrint} from "../../embedding/browser/nsIWebBrowserPrint"
import type {nsIEditor} from "../../editor/nsIEditor"
import type {nsIEditingSession} from "../../editor/composer/nsIEditingSession"
import type {nsITabChild} from "../../dom/interfaces/base/nsITabChild"
import type {nsIPrivacyTransitionObserver} from "./nsIPrivacyTransitionObserver"
import type {nsICommandParams} from "../../embedding/components/commandhandler/nsICommandParams"

export type nsLoadFlags = long
export type nsDocShellType = 0 | 1 | 2
export type nsEnumerationDirection = 0 | 1
export type nsBusyFlag = 0 | 1 | 2 | 3 | 4
export type nsLoadCMD = 0x1 | 0x2 | 0x4 | 0x8
export type nsFrameType = 0 | 1
export type nsTouchEventsOverride = 0 | 1 | 2

export interface nsIDocShellConstants {
  INTERNAL_LOAD_FLAGS_NONE:nsLoadFlags,
  INTERNAL_LOAD_FLAGS_INHERIT_PRINCIPAL:nsLoadFlags,
  INTERNAL_LOAD_FLAGS_DONT_SEND_REFERRER:nsLoadFlags,
  INTERNAL_LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP:nsLoadFlags,
  INTERNAL_LOAD_FLAGS_FIRST_LOAD:nsLoadFlags,
  INTERNAL_LOAD_FLAGS_BYPASS_CLASSIFIER:nsLoadFlags,
  INTERNAL_LOAD_FLAGS_FORCE_ALLOW_COOKIES:nsLoadFlags,
  INTERNAL_LOAD_FLAGS_IS_SRCDOC:nsLoadFlags,
  INTERNAL_LOAD_FLAGS_NO_OPENER:nsLoadFlags,

  ENUMERATE_FORWARDS:nsEnumerationDirection,
  ENUMERATE_BACKWARDS:nsEnumerationDirection,

  APP_TYPE_UNKNOWN:nsDocShellType,
  APP_TYPE_MAIL:nsDocShellType,
  APP_TYPE_EDITOR:nsDocShellType,

  BUSY_FLAGS_NONE:nsBusyFlag,
  BUSY_FLAGS_BUSY:nsBusyFlag,
  BUSY_FLAGS_BEFORE_PAGE_LOAD:nsBusyFlag,
  BUSY_FLAGS_PAGE_LOADING:nsBusyFlag,

  LOAD_CMD_NORMAL:nsLoadCMD,
  LOAD_CMD_RELOAD:nsLoadCMD,
  LOAD_CMD_HISTORY:nsLoadCMD,
  LOAD_CMD_PUSHSTATE:nsLoadCMD,

  FRAME_TYPE_REGULAR:nsFrameType,
  FRAME_TYPE_BROWSER:nsFrameType,

  TOUCHEVENTS_OVERRIDE_DISABLED:nsTouchEventsOverride,
  TOUCHEVENTS_OVERRIDE_ENABLED:nsTouchEventsOverride,
  TOUCHEVENTS_OVERRIDE_NONE:nsTouchEventsOverride
}

export interface nsIDocShell extends nsIDocShellTreeItem {
  contentViewer:nsIContentViewer,
  chromeEventHandler:nsIDOMEventTarget,
  customUserAgent:DOMString,
  allowPlugins:boolean,
  allowJavascript:boolean,
  allowMetaRedirects:boolean,
  allowSubframes:boolean,
  allowImages:boolean,
  allowMedia:boolean,
  allowDNSPrefetch:boolean,
  allowWindowControl:boolean,
  allowContentRetargeting:boolean,
  allowContentRetargetingOnChildren:boolean,
  inheritPrivateBrowsingId:boolean,
  appType:nsDocShellType,
  allowAuth:boolean,
  zoom:float,
  marginWidth:long,
  marginHeight:long,
  loadType:nsLoadCMD,
  defaultLoadFlags:nsLoadFlags,
  isExecutingOnLoadHandler:boolean,
  shouldSaveLayoutState:boolean,
  securityUI:nsISecureBrowserUI,
  restoringDocument:boolean,
  useErrorPages:boolean,
  failedChannel:nsIChannel,
  previousTransIndex:long,
  loadedTransIndex:long,
  currentDocumentChannel:nsIChannel,
  isInUnload:boolean,
  channelIsUnsafe:boolean,
  hasMixedActiveContentLoaded:boolean,
  hasMixedActiveContentBlocked:boolean,
  hasMixedDisplayContentLoaded:boolean,
  hasMixedDisplayContentBlocked:boolean,
  hasTrackingContentBlocked:boolean,
  isOffScreenBrowser:boolean,
  printPreview:nsIWebBrowserPrint,
  canExecuteScripts:boolean,
  isActive:boolean,
  isPrerendered:boolean,
  historyID:nsIDPtr,
  isAppTab:boolean,
  charset:ACString,
  forcedCharset:ACString,
  recordProfileTimelineMarkers:boolean,
  frameType:nsFrameType,
  isMozBrowser:boolean,
  isIsolatedMozBrowserElement:boolean,
  isInIsolatedMozBrowserElement:boolean,
  isInMozBrowser:boolean,
  isTopLevelContentDocShell:boolean,
  asyncPanZoomEnabled:boolean,
  sandboxFlags:long,
  onePermittedSandboxedNavigator:nsIDocShell,
  mixedContentChannel:nsIChannel,
  fullscreenAllowed:boolean,
  mayEnableCharacterEncodingMenu:boolean,
  editor:nsIEditor,
  editable:boolean,
  hasEditingSession:boolean,
  useGlobalHistory:boolean,
  createdDynamically:boolean,
  deviceSizeIsPageSize:boolean,
  hasLoadedNonBlankURI:boolean,
  windowDraggingAllowed:boolean,
  currentScrollRestorationIsManual:boolean,
  editingSession:nsIEditingSession,
  tabChild:nsITabChild,
  touchEventsOverride:nsTouchEventsOverride,
  isOnlyToplevelInTabGroup:boolean,



  addState <data> (aData:data, aTitle:string, aURL:DOMString, aReplace:boolean):void,
  createLoadInfo():nsIDocShellLoadInfo,
  prepareForNewContentModel():void,
  setCurrentURI(aURI:nsIURI):void,
  getDocShellEnumerator(aItemType:nsDocShellType, aDirection:nsEnumerationDirection):nsISimpleEnumerator<nsIDocShell>,
  tabToTreeOwner(forward:boolean, forDocumentNavigation:boolean):boolean,
  isBeingDestroyed():boolean,
  suspendRefreshURIs():void,
  resumeRefreshURIs():void,
  beginRestore(viewer:nsIContentViewer, top:boolean):void,
  finishRestore():void,
  displayLoadError(aError:nsresult,
                    aURI:nsIURI,
                    aURL:wstring,
                    aFailedChannel?:nsIChannel):boolean,
  historyPurged(numEntries:long):void,
  createAboutBlankContentViewer(aPrincipal:nsIPrincipal):void,
  gatherCharsetMenuTelemetry():void,
  now():DOMHighResTimeStamp,
  popProfileTimelineMarkers():Object,
  addWeakPrivacyTransitionObserver(obs:nsIPrivacyTransitionObserver):void,
  addWeakReflowObserver(obs:nsIReflowObserver):void,
  removeWeakReflowObserver(obs:nsIReflowObserver):void,
  getSameTypeParentIgnoreBrowserBoundaries():nsIDocShell,
  getSameTypeRootTreeItemIgnoreBrowserBoundaries():nsIDocShell,
  setFullscreenAllowed(allowed:boolean):void,
  makeEditable(inWaitForUriLoad:boolean):void,
  getChildSHEntry(aChildOffset:long):nsISHEntry,
  addChildSHEntry(aCloneReference:nsISHEntry ,
                  aHistoryEntry:nsISHEntry ,
                  aChildOffset:long,
                  aLoadType:long,
                  aCloneChilden:boolean):void,
  removeFromSessionHistory():void,
  getCurrentSHEntry():nsISHEntry,
  isCommandEnabled(command:string):boolean,
  doCommand(command:string):void,
  doCommandWithParams(command:string, aParams:nsICommandParams):void,
  getOriginAttributes():Object,
  setOriginAttributes(value:Object):void,

}

/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/dom/base/nsIMessageManager.idl

import type {ACString, AString, DOMString, long, float} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIPrincipal} from "../../caps/nsIPrincipal"
import type {nsIURI} from "../../netwerk/base/nsIURI"
import type {nsIDocShell} from "../../docshell/base/nsIDocShell"
import type {nsITabParent} from "../../dom/interfaces/base/nsITabParent"
import type {nsIPrintSettings} from "../../widget/nsIPrintSettings"
import type {nsILoadContext} from "../../docshell/base/nsILoadContext"
import type {nsIPartialSHistory} from "../../docshell/shistory/nsIPartialSHistory"
import type {nsIGroupedSHistory} from "../../docshell/shistory/nsIGroupedSHistory"
import type {nsIWebProgressListener} from "../../uriloader/base/nsIWebProgressListener"


export interface nsIFrameLoaderConstants {
  EVENT_MODE_NORMAL_DISPATCH:number,
  EVENT_MODE_DONT_FORWARD_TO_CHILD:number,
}


export interface nsIFrameLoader extends nsISupports<nsIFrameLoader> {
  docShell:nsIDocShell,
  tabParent:nsITabParent,
  loadContext:nsILoadContext,
  eventMode:long,
  clipSubdocument:boolean,
  clampScrollPosition:boolean,
  ownerElement:Element,
  childID:long,
  visible:boolean,
  ownerIsMozBrowserFrame:boolean,
  lazyWidth:long,
  lazyHeight:long,
  partialSHistory:nsIPartialSHistory,
  groupedSHistory:nsIGroupedSHistory,
  isDead:boolean,

  loadFrame():void,
  loadURI(aURI:nsIURI):void,
  setIsPrerendered():void,
  makePrerenderedLoaderActive():void,
  appendPartialSHistoryAndSwap(aOther:nsIFrameLoader):Promise<void>,
  requestGroupedHistoryNavigation(aGlobalIndex:long):Promise<void>,
  addProcessChangeBlockingPromise(aPromise:Promise<*>):void,
  destroy():void,
  depthTooGreat:boolean,
  activateRemoteFrame():void,
  deactivateRemoteFrame():void,
  sendCrossProcessMouseEvent(aType:string,
                              aX:float,
                              aY:float,
                              aButton:long,
                              aClickCount:long,
                              aModifiers:long,
                              aIgnoreRootScrollFrame?:boolean):void,
  sendCrossProcessKeyEvent(aType:string,
                            aKeyCode:long,
                            aCharCode:long,
                            aModifiers:long,
                            aPreventDefault?:boolean):void,
  requestNotifyAfterRemotePaint():void,
  requestFrameLoaderClose():void,
  print(aOuterWindowID:long,
        aPrintSettings:nsIPrintSettings,
        aProgressListener:nsIWebProgressListener):void,
  ensureGroupedSHistory():nsIGroupedSHistory,

}

export interface nsIFrameLoaderOwner extends nsISupports<nsIFrameLoaderOwner> {
  setIsPrerendered():void
}

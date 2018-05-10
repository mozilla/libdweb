/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/dom/base/nsIMessageManager.idl

import type {ACString, AString, DOMString, long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIPrincipal} from "../../caps/nsIPrincipal"
import type {nsIFrameLoader} from "./nsIFrameLoader"
import type {nsIDocShell} from "../../docshell/base/nsIDocShell"

interface nsIContent {
  // TODO: Fix
}

interface nsMessage <name:string, target, data, objects:null|{[key:string]:*}> {
  target:target,
  name:name,
  sync:boolean,
  data:data,
  json:data,
  objects:objects,
  principal:nsIPrincipal
}

export interface nsIMessageListener<target, data, objects> extends nsISupports<nsIMessageListener<target, data, objects>> {
  receiveMessage(message:nsMessage<target, data, objects>):void
}

export interface nsIMessageListenerManager extends nsISupports<nsIMessageListenerManager> {
  addMessageListener <name:string, target, data, objects> (messageName:name,
                                                            listener:nsIMessageListener<name, target, data, objects>,
                                                            listenWhenClosed?:boolean):void,
  removeMessageListener <name:string, target, data, objects> (messageName:name,
                                                              listener:nsIMessageListener<name, target, data, objects>):void,
  addWeakMessageListener<name:string, target, data, objects> (messageName:name,
                                                            listener:nsIMessageListener<name, target, data, objects>):void,
  removeWeakMessageListener <name:string, target, data, objects> (messageName:name,
                                                                  listener:nsIMessageListener<name, target, data, objects>):void
}

export interface nsIMessageSender extends nsIMessageListenerManager {
  processMessageManager:nsIMessageSender,

  sendAsyncMessage <data, objects, transferable> (messageName:string,
                                                  object?:data,
                                                  objects?:objects,
                                                  principal?:nsIPrincipal,
                                                  transfer?:transferable):void
}

export interface nsIMessageBroadcaster extends nsIMessageListenerManager {
  childCount:long,

  broadcastAsyncMessage <data, objects> (messageName:string,
                                          object?:data,
                                          objects?:objects):void,
  getChildAt(index:long):nsIMessageListenerManager
}


export interface nsISyncMessageSender extends nsIMessageSender {
  sendSyncMessage <data, objects> (messageName:string,
                                    object?:data,
                                    objects?:objects,
                                    principal?:nsIPrincipal):void,
  sendRpcMessage <data, objects, out> (messageName:string,
                                                  object?:data,
                                                  objects?:objects,
                                                  principal?:nsIPrincipal):out
}

export interface nsIMessageManagerGlobal extends nsISyncMessageSender {
  dump(string:DOMString):void,
  privateNoteIntentionalCrash():void,
  atob(aAsciiString:DOMString):DOMString,
  btoa(aBase64Data:DOMString):DOMString
}

export interface nsIContentFrameMessageManager extends nsIMessageManagerGlobal {
  content:any,
  docShell:nsIDocShell
}

export interface nsIInProcessContentFrameMessageManager extends nsIContentFrameMessageManager {
  getOwnerContent():nsIContent,
  cacheFrameLoader(aFrameLoader:nsIFrameLoader):void
}

export interface nsIContentProcessMessageManager extends nsIMessageManagerGlobal {
  initialProcessData:Object
}

export interface nsIFrameScriptLoader extends nsISupports<nsIFrameScriptLoader> {
  loadFrameScript(url:AString, aAllowDelayedLoad:boolean, aRunInGlobalScope?:boolean):void,
  removeDelayedFrameScript(url:AString):void,
  getDelayedFrameScripts():Array<[string, boolean]>
}

export interface nsIProcessScriptLoader extends nsISupports<nsIProcessScriptLoader> {
  loadProcessScript(aURL:AString, aAllowDelayedLoad:boolean):void,
  removeDelayedProcessScript(aURL:AString):void,
  getDelayedProcessScripts():Array<string>
}

export interface nsIGlobalProcessScriptLoader extends nsIProcessScriptLoader {
  initialProcessData:Object
}

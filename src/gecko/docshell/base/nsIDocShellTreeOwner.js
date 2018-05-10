/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIDocShellTreeOwner.idl

import type {ACString, AString, DOMString, long, float} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsITabParent} from "../../dom/interfaces/base/nsITabParent"
import type {nsIDocShellTreeItem} from "./nsIDocShellTreeItem"

export interface nsIDocShellTreeOwnerConstants {
  typeChrome:number,
  typeContent:number,
  typeContentWrapper:number,
  typeChromeWrapper:number,
  typeAll:number
}

export interface nsIDocShellTreeOwner extends nsISupports<nsIDocShellTreeOwner> {
  primaryContentShell:nsIDocShellTreeItem,
  primaryTabParent:nsITabParent,
  tabCount:long,
  hasPrimaryContent:boolean,


  contentShellAdded(aContentShell:nsIDocShellTreeItem, aPrimary:boolean):void,
  contentShellRemoved(aContentShell:nsIDocShellTreeItem):void,
  tabParentAdded(aTab:nsITabParent, aPrimary:boolean):void,
  tabParentRemoved(aTab:nsITabParent):void,
  sizeShellTo(shell:nsIDocShellTreeItem, cx:long, cy:long):void,
  getPrimaryContentSize(width:long, height:long):void,
  setPrimaryContentSize(width:long, height:long):void,
  getRootShellSize(width:long, height:long):void,
  setRootShellSize(width:long, height:long):void,
  setPersistence(aPersistPosition:boolean,
                  aPersistSize:boolean,
                  aPersistSizeMode:boolean):void,
  getPersistence(aPersistPosition:boolean,
                  aPersistSize:boolean,
                  aPersistSizeMode:boolean):void
}

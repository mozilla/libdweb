/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIDocShellTreeItem.idl

import type {ACString, AString, DOMString, long, float} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIPrincipal} from "../../caps/nsIPrincipal"
import type {nsIURI} from "../../netwerk/base/nsIURI"
import type {nsIDocShellTreeOwner} from "./nsIDocShellTreeOwner"

export interface nsIDocShellTreeItemConstants {
  typeChrome:number,
  typeContent:number,
  typeContentWrapper:number,
  typeChromeWrapper:number,
  typeAll:number
}

export interface nsIDocShellTreeItem extends nsISupports<nsIDocShellTreeItem> {
  name:AString,
  itemType:long,
  parent:nsIDocShellTreeItem,
  sameTypeParent:nsIDocShellTreeItem,
  rootTreeItem:nsIDocShellTreeItem,
  sameTypeRootTreeItem:nsIDocShellTreeItem,
  treeOwner:nsIDocShellTreeOwner,
  childCount:long,


  nameEquals(other:AString):boolean,
  findItemWithName(name:AString,
                    aRequestor:nsIDocShellTreeItem,
                    aOriginalRequestor:nsIDocShellTreeItem):nsIDocShellTreeItem,
  addChild(child:nsIDocShellTreeItem):void,
  removeChild(child:nsIDocShellTreeItem):void,
  getChildAt(index:long):nsIDocShellTreeItem,
  findChildWithName(aName:AString,
                    aRecurse:boolean,
                    aSameType:boolean,
                    aRequestor:nsIDocShellTreeItem,
                    aOriginalRequestor:nsIDocShellTreeItem):nsIDocShellTreeItem
}

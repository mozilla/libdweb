/* @flow */

// See https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/io/nsIFile.idl

import type {nsISupports} from "../base/nsISupports"
import type {nsIInputStream} from "./nsIInputStream"
import type {ACString, AString, AUTF8String, long, uint64, PRTime} from "../../xpcom/base/nsrootidl"
import type {nsISimpleEnumerator} from "../ds/nsISimpleEnumerator"

export interface nsIFileConstants {
  OS_READAHEAD:number,
  DELETE_ON_CLOSE:number,
  NORMAL_FILE_TYPE:number,
  DIRECTORY_TYPE:number,
}

export interface nsIFile extends nsISupports<nsIFile> {
  permissions:long,
  leafName:string,
  permissionsOfLink:long,
  lastModifiedTime:PRTime,
  lastModifiedTimeOfLink:PRTime,
  fileSize:uint64,
  fileSizeOfLink:uint64,
  target:AString,
  path:AString,
  parent:nsIFile,
  directoryEntries:nsISimpleEnumerator<nsIFile>,
  followLinks:boolean,
  persistentDescriptor:ACString,

  append(node:string):void,
  normalize():void,
  create(type:long, permissions:long):void,
  copyTo(newParentDir:nsIFile, newName:string):void,
  copyToFollowingLinks(newParentDir:nsIFile, newName:string):void,
  moveTo(newParentDir:nsIFile, newName:AString):void,
  renameTo(newParentDir:nsIFile, newName:AString):void,
  remove(recursive:boolean):boolean,
  exists():boolean,
  isWritable():boolean,
  isReadable():boolean,
  isExecutable():boolean,
  isHidden():boolean,
  isDirectory():boolean,
  isFile():boolean,
  isSymlink():boolean,
  isSpecial():boolean,
  createUnique(typ:long, permission:long):void,
  clone():nsIFile,
  equals(other:nsIFile):boolean,
  contains(other:nsIFile):boolean,
  initWithPath(filePath:string):void,
  initWithFile(file:nsIFile):void,
  appendRelativePath(relativeFilePath:AString):void,
  reveal():void,
  launch():void,
  getRelativeDescriptor(fromFile:nsIFile):ACString,
  setRelativeDescriptor(fromFile:nsIFile, relativeDesc:ACString):void,
  getRelativePath(fromFile:nsIFile):AUTF8String,
  setRelativePath(fromFile:nsIFile, relativeDesc:AUTF8String):void
}

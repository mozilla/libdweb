/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIProtocolHandler.idl

import type {nsresult, AUTF8String, ACString, long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIURI} from "./nsIURI"
import type {nsIChannel} from "./nsIChannel"
import type {nsILoadInfo} from "./nsILoadInfo"

export interface nsIProtocolHandlerConstants {
  URI_STD:long,
  URI_NORELATIVE:long,
  URI_NOAUTH:long,
  ALLOWS_PROXY:long,
  ALLOWS_PROXY_HTTP:long,
  URI_INHERITS_SECURITY_CONTEXT:long,
  URI_FORBIDS_AUTOMATIC_DOCUMENT_REPLACEMENT:long,
  URI_LOADABLE_BY_ANYONE:long,
  URI_DANGEROUS_TO_LOAD:long,
  URI_IS_UI_RESOURCE:long,
  URI_IS_LOCAL_FILE:long,
  URI_LOADABLE_BY_SUBSUMERS:long,
  URI_DOES_NOT_RETURN_DATA:long,
  URI_IS_LOCAL_RESOURCE:long,
  URI_OPENING_EXECUTES_SCRIPT:long,
  URI_NON_PERSISTABLE:long,
  URI_FORBIDS_COOKIE_ACCESS:long,
  URI_CROSS_ORIGIN_NEEDS_WEBAPPS_PERM:long,
  URI_SYNC_LOAD_IS_OK:long,
  URI_SAFE_TO_LOAD_IN_SECURE_CONTEXT:long,
  URI_FETCHABLE_BY_ANYONE:long,
  ORIGIN_IS_FULL_SPEC:long,
  URI_SCHEME_NOT_SELF_LINKABLE:long
}

export interface nsIProtocolHandler extends nsISupports<nsIProtocolHandler> {
  defaultPort:long,
  protocolFlags:long,
  scheme:ACString,
  // Lets a protocol override blacklisted ports. This method is called when
  // there's an attempt to connect to a port that is blacklisted. For example,
  // for most protocols, port 25 (Simple Mail Transfer Protocol) is banned.
  // When a URI containing this port number is encountered, this method is
  // called to ask if the protocol handler wants to override the ban.
  allowPort(port:long, scheme:string):boolean,
  // Constructs a new channel from the given URI for this protocol handler.
  newChannel(uri:nsIURI):nsIChannel,
  newURI(spec:AUTF8String, originCharset:string, baseURI:null|nsIURI):nsIURI,
  newChannel2(uri:nsIURI, loadInfo:nsILoadInfo):nsIChannel
}

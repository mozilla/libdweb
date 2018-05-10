/* @flow */

import type {nsIDomainSet, nsIDomainPolicy} from "./caps/nsIDomainPolicy"
import type {nsIPrincipal, nsIPrincipalContstants} from "./caps/nsIPrincipal"
import type {nsIScriptSecurityManager, nsIScriptSecurityManagerConstants} from "./caps/nsIScriptSecurityManager"

import type {
  nsIMessageListener,
  nsIMessageListenerManager,
  nsIMessageSender,
  nsIMessageBroadcaster,
  nsISyncMessageSender,
  nsIMessageManagerGlobal,
  nsIContentFrameMessageManager,
  nsIInProcessContentFrameMessageManager,
  nsIContentProcessMessageManager,
  nsIFrameScriptLoader,
  nsIProcessScriptLoader,
  nsIGlobalProcessScriptLoader
} from "./dom/base/nsIMessageManager"
import type {nsIChannel, nsIChannelConstants} from "./netwerk/base/nsIChannel"
import type {nsIAsyncVerifyRedirectCallback} from "./netwerk/base/nsIAsyncVerifyRedirectCallback"
import type {nsIChannelEventSink, nsIChannelEventSinkConstants} from "./netwerk/base/nsIChannelEventSink"
import type {nsIInputStreamChannel} from "./netwerk/base/nsIInputStreamChannel"
import type {nsIIOService} from "./netwerk/base/nsIIOService"
import type {nsILoadInfo, nsILoadInfoConstants} from "./netwerk/base/nsILoadInfo"
import type {nsIProtocolHandler, nsIProtocolHandlerConstants} from "./netwerk/base/nsIProtocolHandler"
import type {nsIRequest, nsIRequestConstants} from "./netwerk/base/nsIRequest"
import type {nsIRequestObserver} from "./netwerk/base/nsIRequestObserver"
import type {nsIStandardURL, nsStandardURLType, nsIStandardURLConstants} from "./netwerk/base/nsIStandardURL"
import type {nsIStreamListener} from "./netwerk/base/nsIStreamListener"
import type {nsIURI} from "./netwerk/base/nsIURI"
import type {nsIURL} from "./netwerk/base/nsIURL"

import type {nsITransportSecurityInfo} from "./netwerk/socket/nsITransportSecurityInfo"

import type {nsIInterfaceRequestor} from "./xpcom/base/nsIInterfaceRequestor"
import type {nsIMutable} from "./xpcom/base/nsIMutable"
import type {nsISupports, nsIIDRef} from "./xpcom/base/nsISupports"
import type {nsIUUIDGenerator} from "./xpcom/base/nsIUUIDGenerator"
import type {nsresult} from "./xpcom/base/nsrootidl"
import type {nsIJSID, nsIJSCID} from "./xpcom/base/xpcjsid"

import type {nsIComponentManager} from "./xpcom/components/nsIComponentManager"
import type {nsIComponentRegistrar} from "./xpcom/components/nsIComponentRegistrar"
import type {nsIFactory} from "./xpcom/components/nsIFactory"

import type {nsISimpleEnumerator} from "./xpcom/ds/nsISimpleEnumerator"

import type {nsIAsyncInputStream, nsIAsyncInputStreamConstants} from "./xpcom/io/nsIAsyncInputStream"
import type {nsIAsyncOutputStream, nsIAsyncOutputStreamConstants} from "./xpcom/io/nsIAsyncOutputStream"
import type {nsIBinaryInputStream} from "./xpcom/io/nsIBinaryInputStream"
import type {nsIBinaryOutputStream} from "./xpcom/io/nsIBinaryOutputStream"
import type {nsIFile, nsIFileConstants} from "./xpcom/io/nsIFile"
import type {nsIInputStream} from "./xpcom/io/nsIInputStream"
import type {nsIOutputStream} from "./xpcom/io/nsIOutputStream"
import type {nsIPipe} from "./xpcom/io/nsIPipe"
import type {nsIScriptableInputStream} from "./xpcom/io/nsIScriptableInputStream"

import type {nsIXULRuntime, nsIXULRuntimeConstants} from "./xpcom/system/nsIXULRuntime"


declare function ID(iid:string):nsIJSID

declare var Components:{
  results:{
    NS_ERROR_NOT_INITIALIZED: nsresult,
    NS_ERROR_ALREADY_INITIALIZED: nsresult,
    NS_ERROR_NOT_IMPLEMENTED: nsresult,
    NS_ERROR_NO_INTERFACE: nsresult,
    NS_ERROR_NULL_POINTER: nsresult,
    NS_ERROR_ABORT: nsresult,
    NS_ERROR_FAILURE: nsresult,
    NS_ERROR_UNEXPECTED: nsresult,
    NS_ERROR_OUT_OF_MEMORY: nsresult,
    NS_ERROR_ILLEGAL_VALUE: nsresult,
    NS_ERROR_NO_AGGREGATION: nsresult,
    NS_ERROR_NOT_AVAILABLE: nsresult,
    NS_ERROR_FACTORY_NOT_REGISTERED: nsresult,
    NS_ERROR_FACTORY_REGISTER_AGAIN: nsresult,
    NS_ERROR_FACTORY_NOT_LOADED: nsresult,
    NS_ERROR_FACTORY_EXISTS: nsresult,
    NS_ERROR_FACTORY_NO_SIGNATURE_SUPPORT: nsresult,
    NS_ERROR_PROXY_INVALID_IN_PARAMETER: nsresult,
    NS_ERROR_PROXY_INVALID_OUT_PARAMETER: nsresult,
    NS_ERROR_CANNOT_CONVERT_DATA: nsresult,
    NS_ERROR_OBJECT_IS_IMMUTABLE: nsresult,
    NS_ERROR_LOSS_OF_SIGNIFICANT_DATA: nsresult,
    NS_ERROR_ILLEGAL_DURING_SHUTDOWN: nsresult,

    NS_BINDING_ABORTED: nsresult,
    NS_OK: nsresult
  },
  interfaces:{
    nsIDomainSet:nsIJSID,
    nsIDomainPolicy:nsIJSID,
    nsIPrincipal:nsIJSID & nsIPrincipalContstants,
    nsIScriptSecurityManager:nsIJSID & nsIScriptSecurityManagerConstants,

    nsIMessageListener:nsIJSID,
    nsIMessageListenerManager:nsIJSID,
    nsIMessageSender:nsIJSID,
    nsIMessageBroadcaster:nsIJSID,
    nsISyncMessageSender:nsIJSID,
    nsIMessageManagerGlobal:nsIJSID,
    nsIContentFrameMessageManager:nsIJSID,
    nsIInProcessContentFrameMessageManager:nsIJSID,
    nsIContentProcessMessageManager:nsIJSID,
    nsIFrameScriptLoader:nsIJSID,
    nsIProcessScriptLoader:nsIJSID,
    nsIGlobalProcessScriptLoader:nsIJSID,

    nsIAsyncVerifyRedirectCallback:nsIJSID,
    nsIChannel:nsIJSID & nsIChannelConstants,
    nsIChannelEventSink:nsIJSID & nsIChannelEventSinkConstants,
    nsIInputStreamChannel:nsIJSID,
    nsIIOService:nsIJSID,
    nsILoadInfo:nsIJSID & nsILoadInfoConstants,
    nsIProtocolHandler:nsIJSID & nsIProtocolHandlerConstants,
    nsIRequest:nsIJSID & nsIRequestConstants,
    nsIRequestObserver:nsIJSID,
    nsIStandardURL:nsIJSID & nsIStandardURLConstants,
    nsIStreamListener:nsIJSID,
    nsIURI:nsIJSID,
    nsIURL:nsIJSID,

    nsITransportSecurityInfo:nsIJSID,

    nsIInterfaceRequestor:nsIJSID,
    nsISupports:nsIJSID,
    nsIUUIDGenerator:nsIJSID,

    nsIComponentManager:nsIJSID,
    nsIComponentRegistrar:nsIJSID,
    nsIFactory:nsIJSID,

    nsISimpleEnumerator:nsIJSID,

    nsIAsyncInputStream:nsIJSID & nsIAsyncInputStreamConstants,
    nsIAsyncOutputStream:nsIJSID & nsIAsyncOutputStreamConstants,
    nsIBinaryInputStream:nsIJSID,
    nsIBinaryOutputStream:nsIJSID,
    nsIFile:nsIJSID & nsIFileConstants,
    nsIInputStream:nsIJSID,
    nsIOutputStream:nsIJSID,
    nsIPipe:nsIJSID,
    nsIScriptableInputStream:nsIJSID,

    nsIXULRuntime:nsIJSID & nsIXULRuntimeConstants,

    nsIMutable:nsIJSID
  },
  classes:{
    '@mozilla.org/network/simple-uri;1':nsIJSCID<nsIURI & nsIMutable>,
    '@mozilla.org/network/io-service;1':nsIJSCID<nsIIOService>,
    '@mozilla.org/network/standard-url;1':nsIJSCID<nsIStandardURL>,
    '@mozilla.org/xre/app-info;1':nsIJSCID<nsIXULRuntime>,
    '@mozilla.org/uuid-generator;1':nsIJSCID<nsIUUIDGenerator>,
    '@mozilla.org/childprocessmessagemanager;1':nsIJSCID<nsIMessageListenerManager & nsIMessageSender & nsIContentProcessMessageManager>,
    '@mozilla.org/parentprocessmessagemanager;1':nsIJSCID<nsIProcessScriptLoader & nsIMessageListenerManager & nsIMessageBroadcaster>,
    '@mozilla.org/globalmessagemanager;1':nsIJSCID<nsIFrameScriptLoader & nsIMessageListenerManager & nsIGlobalProcessScriptLoader>,
    '@mozilla.org/pipe;1':nsIJSCID<nsIPipe>,
    '@mozilla.org/network/input-stream-channel;1':nsIJSCID<nsIInputStreamChannel>,
    '@mozilla.org/scriptsecuritymanager;1':nsIJSCID<nsIScriptSecurityManager>
  },
  manager:nsIComponentManager,
  ID:typeof ID
}

export const Cc = Components.classes
export const Ci = Components.interfaces
export const Cr = Components.results
export const Cm = Components.manager
export const CID = Components.ID

export type {
  nsIPrincipal,
  nsIMessageListener,
  nsIMessageSender,
  nsIMessageBroadcaster,
  nsISyncMessageSender,
  nsIMessageManagerGlobal,
  nsIContentFrameMessageManager,
  nsIInProcessContentFrameMessageManager,
  nsIContentProcessMessageManager,
  nsIFrameScriptLoader,
  nsIProcessScriptLoader,
  nsIGlobalProcessScriptLoader,
  nsIChannel,
  nsIAsyncVerifyRedirectCallback,
  nsIChannelEventSink,
  nsIInputStreamChannel,
  nsIIOService,
  nsILoadInfo,
  nsIProtocolHandler,
  nsIRequest,
  nsIRequestObserver,
  nsIStandardURL,
  nsIStreamListener,
  nsIURI,
  nsIURL,
  nsITransportSecurityInfo,
  nsIInterfaceRequestor,
  nsIMutable,
  nsISupports, nsIIDRef,
  nsIUUIDGenerator,
  nsresult,
  nsIJSID, nsIJSCID,
  nsIComponentManager,
  nsIComponentRegistrar,
  nsIFactory,
  nsIAsyncInputStream,
  nsIAsyncOutputStream,
  nsIBinaryInputStream,
  nsIBinaryOutputStream,
  nsIFile,
  nsIInputStream,
  nsIOutputStream,
  nsIPipe,
  nsIScriptableInputStream,
  nsIXULRuntime
}

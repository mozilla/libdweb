// @flow

declare module "gecko" {
  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/js/xpconnect/idl/xpcjsid.idl
  declare export interface nsIJSID<nsQIResult> {
    name: string;
    number: string;
    valid: boolean;
    equals<other>(nsIJSID<other>): boolean;
    toString(): string;
  }

  declare export interface nsIJSIID<nsQIResult> extends nsIJSID<nsQIResult> {}

  declare export interface nsIJSCID<+nsQIResult> extends nsIJSID<nsQIResult> {
    createInstance(
      iid: nsIJSID<nsQIResult>
    ): nsISupports<nsQIResult> & nsQIResult;
    getService(iid: nsIJSID<nsQIResult>): nsISupports<nsQIResult> & nsQIResult;
  }

  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/base/nsISupports.idl

  declare export interface nsISupports<+nsQIResult> {
    QueryInterface(uuid: nsIIDRef<nsQIResult>): nsQIResult;
  }

  // Export nsIJSID as nsIIDRef as well since that is what exposed to scriptable
  // XPCOM.
  declare export interface nsIIDRef<nsQIResult> extends nsIJSID<nsQIResult> {}
  declare export interface nsIDPtr extends nsIJSID<empty> {}
  declare export interface nsCIDRef<nsQIResult> extends nsIJSID<nsQIResult> {}
  declare export interface nsCIDPtr<nsQIResult> extends nsIJSID<nsQIResult> {}

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/base/nsrootidl.idl

  declare export type nsresult = $Values<typeof Cr>

  declare export type DOMString = string
  declare export type AUTF8String = string
  declare export type ACString = string
  declare export type AString = string
  declare export type wstring = string
  declare export type nsISupportsCString = string

  declare export type PRUint32 = number
  declare export type PRInt32 = number
  declare export type short = number
  declare export type long = number
  declare export type double = number
  declare export type float = number
  declare export type uint8 = number
  declare export type uint16 = number
  declare export type uint32 = number
  declare export type uint64 = number
  declare export type int32_t = number

  declare export type PRTime = number
  declare export type DOMHighResTimeStamp = number

  // See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/base/nsIMutable.idl

  declare export interface nsIMutable {
    mutable: boolean;
  }

  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/base/nsIInterfaceRequestor.idl

  declare export interface nsIInterfaceRequestor<+nsQIResult>
    extends nsISupports<nsQIResult> {
    getInterface(uuid: nsIIDRef<nsQIResult>): nsQIResult;
  }

  // See https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/base/nsIUUIDGenerator.idl

  declare export interface nsIUUIDGenerator {
    generateUUID(): nsIDPtr;
  }

  declare export interface nsIComponentManager {
    getClassObject<nsQIResult>(
      aClass: nsCIDRef<nsQIResult>,
      iid: nsIIDRef<nsQIResult>
    ): nsQIResult;
    getClassObjectByContractID<nsQIResult>(
      aContractID: string,
      aIID: nsIIDRef<nsQIResult>
    ): nsQIResult;
    createInstance<nsQIResult>(
      aClass: nsCIDRef<nsQIResult>,
      aDelegate: nsISupports<nsQIResult>,
      aIID: nsIIDRef<nsQIResult>
    ): nsQIResult;
    createInstanceByContractID<nsQIResult>(
      aContractID: string,
      aDelegate: nsISupports<nsQIResult>,
      aIID: nsIIDRef<nsQIResult>
    ): nsQIResult;
    addBootstrappedManifestLocation(aLocation: nsIFile): void;
    removeBootstrappedManifestLocation(aLocation: nsIFile): void;
    getManifestLocations(): nsISimpleEnumerator<nsIFile>;
  }

  declare export interface nsIComponentRegistrar {
    autoRegister(spec: nsIFile): void;
    autoUnregister(spec: nsIFile): void;
    registerFactory<a>(
      aClass: nsCIDRef<a>,
      aClassName: string,
      aContractID: string,
      aFactory: nsIFactory<a>
    ): void;
    unregisterFactory<a>(aClass: nsCIDRef<a>, aFactory: nsIFactory<a>): void;
    isCIDRegistered<a>(aClass: nsCIDRef<a>): boolean;
    isContractIDRegistered(aContractID: string): boolean;
    enumerateCIDs(): nsISimpleEnumerator<nsCIDRef<*>>;
    enumerateContractIDs(): nsISimpleEnumerator<string>;
    contractIDToCID<a>(aContractID: string): nsCIDPtr<a>;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/components/nsIFactory.idl

  declare export interface nsIFactory<nsQIResult>
    extends nsISupports<nsIFactory<nsQIResult>> {
    createInstance(
      outer: null | nsISupports<nsQIResult>,
      iid: nsIIDRef<nsQIResult>
    ): nsQIResult;
    lockFactory(lock: boolean): void;
  }

  // See https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/io/nsIFile.idl

  declare export interface nsISimpleEnumerator<nsQIResult>
    extends nsISupports<nsISimpleEnumerator<nsQIResult>> {
    hasMoreElements(): boolean;
    getNext(): nsISupports<nsQIResult>;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIAsyncVerifyRedirectCallback.idl

  declare export interface nsIAsyncVerifyRedirectCallback {
    // Complement to nsIChannelEventSink asynchronous callback. The result of
    // the redirect decision is passed through this callback.
    // result is Result of the redirect veto decision. If FAILED the redirect
    // has been vetoed. If SUCCEEDED the redirect has been allowed by all
    // consumers.
    onRedirectVerifyCallback(result: nsresult): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIChannel.idl
  declare interface nsIChannelConstants {
    LOAD_DOCUMENT_URI: long;
    LOAD_RETARGETED_DOCUMENT_URI: long;
    LOAD_REPLACE: long;
    LOAD_INITIAL_DOCUMENT_URI: long;
    LOAD_TARGETED: long;
    LOAD_CALL_CONTENT_SNIFFERS: long;
    LOAD_CLASSIFY_URI: long;
    LOAD_MEDIA_SNIFFER_OVERRIDES_CONTENT_TYPE: long;
    LOAD_EXPLICIT_CREDENTIALS: long;
    LOAD_BYPASS_SERVICE_WORKER: long;
    DISPOSITION_INLINE: long;
    DISPOSITION_ATTACHMENT: long;
  }

  declare export interface nsIChannel extends nsIRequest {
    contentCharset: ?ACString;
    contentLength: uint64;
    contentType: ?ACString;
    contentDisposition: long;
    contentDispositionFilename: AString;
    contentDispositionHeader: ACString;
    loadInfo: nsILoadInfo | null;
    notificationCallbacks: nsIInterfaceRequestor<nsIProgressEventSink> | null;
    originalURI: nsIURI;
    owner: nsISupports<*> | null;
    securityInfo: null | nsITransportSecurityInfo;
    URI: nsIURI;
    asyncOpen(listener: nsIStreamListener, context: nsISupports<*>): void;
    asyncOpen2(listener: nsIStreamListener): void;
    open(): nsIInputStream;
    open2(): nsIInputStream;
  }

  declare export interface nsIProgressEventSink {
    onProgress(
      aRequest: nsIRequest,
      aContext: nsISupports<*>,
      aProgress: long,
      aProgressMax: long
    ): void;
    onStatus(
      aRequest: nsIRequest,
      aContext: nsISupports<*>,
      aStatus: nsresult,
      aStatusArg: wstring
    ): void;
  }

  declare export interface nsISocketTransport {
    getTimeout(aType: nsSocketTransportTimeoutType): long;
    isAlive(): boolean;
    setTimeout(aType: nsSocketTransportTimeoutType, aValue: long): void;

    connectionFlags: nsSocketTransportConnectionFlag;
    host: AUTF8String;
    port: long;
    // securityCallbacks:nsIInterfaceRequestor<nsISSLSocketControl & nsIBadCertListener2 & nsISSLErrorListener>;
    securityInfo: nsISupports<nsISSLSocketControl> &
      nsISupports<nsITransportSecurityInfo>;
  }

  declare export interface nsISSLSocketControl {
    proxyStartSSL(): void;
    StartTLS(): void;
    notificationCallbacks: nsIInterfaceRequestor<*>;
  }

  declare export interface nsISSLStatusProvider {
    // TODO:...
  }

  declare export opaque type nsSocketTransportStatus: nsresult
  declare export opaque type nsSocketTransportTimeoutType: long
  declare export opaque type nsSocketTransportConnectionFlag: long

  declare export interface nsISocketTransportConstants {
    TIMEOUT_CONNECT: nsSocketTransportTimeoutType;
    TIMEOUT_READ_WRITE: nsSocketTransportTimeoutType;

    STATUS_RESOLVING: nsSocketTransportStatus;
    STATUS_RESOLVED: nsSocketTransportStatus;
    STATUS_CONNECTING_TO: nsSocketTransportStatus;
    STATUS_CONNECTED_TO: nsSocketTransportStatus;
    STATUS_SENDING_TO: nsSocketTransportStatus;
    STATUS_WAITING_FOR: nsSocketTransportStatus;
    STATUS_RECEIVING_FROM: nsSocketTransportStatus;

    BYPASS_CACHE: nsSocketTransportConnectionFlag;
    ANONYMOUS_CONNECT: nsSocketTransportConnectionFlag;
    DISABLE_IPV6: nsSocketTransportConnectionFlag;
  }

  declare export opaque type nsIX509CertType: long

  declare export interface nsIX509CertConstants {
    UNKNOWN_CERT: nsIX509CertType;
    CA_CERT: nsIX509CertType;
    USER_CERT: nsIX509CertType;
    EMAIL_CERT: nsIX509CertType;
    SERVER_CERT: nsIX509CertType;
    ANY_CERT: nsIX509CertType;
  }

  declare export interface nsIX509Cert {
    +emailAddress: AString;
    +isBuiltInRoot: boolean;
    containsEmailAddress(aEmailAddress: AString): boolean;
    +subjectName: AString;
    +subjectAltNames: AString;
    +commonName: AString;
    +organization: AString;
    +organizationalUnit: AString;
    +sha256Fingerprint: AString;
    +sha1Fingerprint: AString;
    +tokenName: AString;
    +issuerName: AString;
    +serialNumber: AString;
    +issuerCommonName: AString;
    +issuerOrganization: AString;
    +issuerOrganizationUnit: AString;
    +validity: nsIX509CertValidity;
    +dbKey: ACString;
    +displayName: AString;
    +certType: nsIX509CertType;
    +isSelfSigned: boolean;
    +keyUsages: AString;
    +ASN1Structure: nsIASN1Object;
    getRawDER(): long[];
    equals(nsIX509Cert): boolean;
    +sha256SubjectPublicKeyInfoDigest: ACString;
    markForPermDeletion(): void;
  }

  declare export interface nsIX509CertValidity {
    +notBefore: PRTime;
    +notBeforeLocalTime: AString;
    +notBeforeLocalDay: AString;
    +notBeforeGMT: AString;
    +notAfter: PRTime;
    +notAfterLocalTime: AString;
    +notAfterLocalDay: AString;
    +otAfterGMT: AString;
  }

  declare export interface nsIASN1Object {
    type: nsIASN1ObjectType;
    tag: long;
    displayName: AString;
    displayValue: AString;
  }

  declare export interface nsIASN1ObjectConstants {
    ANS1_END_CONTENTS: nsIASN1ObjectType;
    ANS1_BOOLEAN: nsIASN1ObjectType;
    ANS1_INTEGER: nsIASN1ObjectType;
    ANS1_BIT_STRING: nsIASN1ObjectType;
    ANS1_OCTET_STRING: nsIASN1ObjectType;
    ANS1_NULL: nsIASN1ObjectType;
    ANS1_OBJECT_ID: nsIASN1ObjectType;
    ANS1_ENUMERATED: nsIASN1ObjectType;
    ANS1_UTF8_STRING: nsIASN1ObjectType;
    ANS1_SEQUENCE: nsIASN1ObjectType;
    ANS1_SET: nsIASN1ObjectType;
    ANS1_PRINTABLE_STRING: nsIASN1ObjectType;
    ANS1_T61_STRING: nsIASN1ObjectType;
    ANS1_IA5_STRING: nsIASN1ObjectType;
    ANS1_UTC_TIME: nsIASN1ObjectType;
    ANS1_GEN_TIME: nsIASN1ObjectType;
    ANS1_VISIBLE_STRING: nsIASN1ObjectType;
    ANS1_UNIVERSAL_STRING: nsIASN1ObjectType;
    ANS1_BMP_STRING: nsIASN1ObjectType;
    ANS1_HIGH_TAG_NUMBER: nsIASN1ObjectType;
    ANS1_CONTEXT_SPECIFIC: nsIASN1ObjectType;
    ANS1_APPLICATION: nsIASN1ObjectType;
    ANS1_PRIVATE: nsIASN1ObjectType;
  }

  declare export opaque type nsIASN1ObjectType: long

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIChannelEventSink.idl
  declare export interface nsIChannelEventSinkConstants {
    REDIRECT_TEMPORARY: long;
    REDIRECT_PERMANENT: long;
    REDIRECT_INTERNAL: long;
    REDIRECT_STS_UPGRADE: long;
  }

  declare export interface nsIChannelEventSink {
    asyncOnChannelRedirect(
      oldChannel: nsIChannel,
      newChannel: nsIChannel,
      flags: long,
      callback: nsIAsyncVerifyRedirectCallback
    ): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/netwerk/base/nsIInputStreamChannel.idl
  declare export interface nsIInputStreamChannel {
    contentStream: nsIInputStream;
    srcdocData: AString;
    isSrcdocChannel: boolean;
    baseURI: nsIURI;

    setURI(aURI: nsIURI): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIIOService.idl
  declare export interface nsIIOService {
    getProtocolHandler(scheme: string): nsIProtocolHandler;
    getProtocolFlags(aScheme: string): long;
    newURI(
      aSpec: AUTF8String,
      aOriginCharset: null | string,
      aBaseURI: null | nsIURI
    ): nsIURI & nsISupports<nsIURI & nsIFileURL>;
    newFileURI(aFile: nsIFile): nsIURI;
    newChannelFromURI(aURI: nsIURI): nsIURI;
    newChannelFromURI2(
      aURI: nsIURI,
      aLoadingNode: null | Node,
      aLoadingPrincipal: null | nsIPrincipal,
      aTriggeringPrincipal: null | nsIPrincipal,
      aSecurityFlags: null | long,
      aContentPolicyType: null | long
    ): nsIChannel;
    newChannelFromURIWithLoadInfo(
      aURI: nsIURI,
      aLoadInfo: null | nsILoadInfo
    ): nsIChannel;
    newChannel(
      spec: AUTF8String,
      aOriginCharset: string,
      baseURI: null | nsIURI
    ): nsIChannel;
    newChannel2(
      spec: AUTF8String,
      aOriginCharset: string,
      baseURI: null | nsIURI,
      aLoadingNode: null | Node,
      aLoadingPrincipal: null | nsIPrincipal,
      aTriggeringPrincipal: null | nsIPrincipal,
      aSecurityFlags: null | long,
      aContentPolicyType: null | long
    ): nsIChannel;
    offline: boolean;
    connectivity: boolean;
    allowPort(aPort: long, aScheme: string): boolean;
    extractScheme(urlString: AUTF8String): ACString;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsILoadInfo.idl
  declare export opaque type nsSecurityFlags: long

  declare export interface nsILoadInfoConstants {
    SEC_NORMAL: nsSecurityFlags;

    // security checks
    SEC_ONLY_FOR_EXPLICIT_CONTENTSEC_CHECK: nsSecurityFlags;
    SEC_REQUIRE_SAME_ORIGIN_DATA_INHERITS: nsSecurityFlags;
    SEC_REQUIRE_SAME_ORIGIN_DATA_IS_BLOCKED: nsSecurityFlags;
    SEC_ALLOW_CROSS_ORIGIN_DATA_INHERITS: nsSecurityFlags;
    SEC_ALLOW_CROSS_ORIGIN_DATA_IS_NULL: nsSecurityFlags;
    SEC_REQUIRE_CORS_DATA_INHERITS: nsSecurityFlags;

    //  cookie policy
    SEC_COOKIES_DEFAULT: nsSecurityFlags;
    SEC_COOKIES_INCLUDE: nsSecurityFlags;
    SEC_COOKIES_SAME_ORIGIN: nsSecurityFlags;
    SEC_COOKIES_OMIT: nsSecurityFlags;

    // Force inheriting of the principal
    SEC_FORCE_INHERIT_PRINCIPA: nsSecurityFlags;
    SEC_SANDBOXED: nsSecurityFlags;
    SEC_ABOUT_BLANK_INHERITS: nsSecurityFlags;
    SEC_ALLOW_CHROME: nsSecurityFlags;
    SEC_DISALLOW_SCRIPT: nsSecurityFlags;
    SEC_DONT_FOLLOW_REDIRECTS: nsSecurityFlags;
    SEC_LOAD_ERROR_PAGE: nsSecurityFlags;
    SEC_FORCE_INHERIT_PRINCIPAL_OVERRULE_OWNER: nsSecurityFlags;
  }

  declare export interface nsILoadInfo {
    +loadingPrincipal: nsIPrincipal;
    +triggeringPrincipal: nsIPrincipal;
    principalToInherit: nsIPrincipal;
    +loadingDocument: Document;
    securityFlags: nsSecurityFlags;
    +loadingContext: nsISupports<*>;
    +securityMode: nsSecurityFlags;
    +isInThirdPartyContext: boolean;
    +cookiePolicy: nsSecurityFlags;
    +forceInheritPrincipal: boolean;
    +forceInheritPrincipalOverruleOwner: boolean;
    +loadingSandboxed: boolean;
    +aboutBlankInherits: boolean;
    +allowChrome: boolean;
    +disallowScript: boolean;
    +dontFollowRedirects: boolean;
    +loadErrorPage: boolean;
    +isDocshellReload: boolean;
    +externalContentPolicyType: nsSecurityFlags;
    +upgradeInsecureRequests: boolean;
    +browserUpgradeInsecureRequests: boolean;
    +browserWouldUpgradeInsecureRequests: boolean;
    +verifySignedContent: boolean;
    enforceSRI: boolean;
    forceAllowDataURI: boolean;
    allowInsecureRedirectToDataURI: boolean;
    skipContentPolicyCheckForWebRequest: boolean;
    originalFrameSrcLoad: boolean;
    +forceInheritPrincipalDropped: boolean;
    +innerWindowID: long;
    +outerWindowID: long;
    +parentOuterWindowID: long;
    +topOuterWindowID: long;
    +frameOuterWindowID: long;
    resetPrincipalToInheritToNullPrincipal(): void;
    originAttributes: Object;
    enforceSecurity: boolean;
    initialSecurityCheckDone: boolean;
    loadTriggeredFromExternal: boolean;
    +redirectChainIncludingInternalRedirects: Object;
    +redirectChain: Object;
    +forcePreflight: boolean;
    +isPreflight: boolean;
    +tainting: nsSecurityFlags;
    maybeIncreaseTainting(nsSecurityFlags): void;
    +isTopLevelLoad: boolean;
    resultPrincipalURI: nsIURI;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIProtocolHandler.idl

  declare export interface nsIProtocolHandlerConstants {
    URI_STD: long;
    URI_NORELATIVE: long;
    URI_NOAUTH: long;
    ALLOWS_PROXY: long;
    ALLOWS_PROXY_HTTP: long;
    URI_INHERITS_SECURITY_CONTEXT: long;
    URI_FORBIDS_AUTOMATIC_DOCUMENT_REPLACEMENT: long;
    URI_LOADABLE_BY_ANYONE: long;
    URI_DANGEROUS_TO_LOAD: long;
    URI_IS_UI_RESOURCE: long;
    URI_IS_LOCAL_FILE: long;
    URI_LOADABLE_BY_SUBSUMERS: long;
    URI_DOES_NOT_RETURN_DATA: long;
    URI_IS_LOCAL_RESOURCE: long;
    URI_OPENING_EXECUTES_SCRIPT: long;
    URI_NON_PERSISTABLE: long;
    URI_FORBIDS_COOKIE_ACCESS: long;
    URI_CROSS_ORIGIN_NEEDS_WEBAPPS_PERM: long;
    URI_SYNC_LOAD_IS_OK: long;
    URI_SAFE_TO_LOAD_IN_SECURE_CONTEXT: long;
    URI_FETCHABLE_BY_ANYONE: long;
    ORIGIN_IS_FULL_SPEC: long;
    URI_SCHEME_NOT_SELF_LINKABLE: long;
  }

  declare export interface nsIProtocolHandler {
    defaultPort: long;
    protocolFlags: long;
    scheme: ACString;
    // Lets a protocol override blacklisted ports. This method is called when
    // there's an attempt to connect to a port that is blacklisted. For example,
    // for most protocols, port 25 (Simple Mail Transfer Protocol) is banned.
    // When a URI containing this port number is encountered, this method is
    // called to ask if the protocol handler wants to override the ban.
    allowPort(port: long, scheme: string): boolean;
    // Constructs a new channel from the given URI for this protocol handler.
    newChannel(uri: nsIURI): nsIChannel;
    newURI(
      spec: AUTF8String,
      originCharset: string,
      baseURI: null | nsIURI
    ): nsIURI;
    newChannel2(uri: nsIURI, loadInfo: nsILoadInfo): nsIChannel;
  }

  /* @flow */

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIRequest.idl

  declare export opaque type nsLoadFlags: number

  declare export interface nsIRequestConstants {
    LOAD_REQUESTMASK: nsLoadFlags;
    LOAD_NORMAL: nsLoadFlags;
    LOAD_BACKGROUND: nsLoadFlags;
    INHIBIT_PIPELINE: nsLoadFlags;
    INHIBIT_CACHING: nsLoadFlags;
    INHIBIT_PERSISTENT_CACHING: nsLoadFlags;
    LOAD_BYPASS_CACHE: nsLoadFlags;
    LOAD_FROM_CACHE: nsLoadFlags;
    VALIDATE_ALWAYS: nsLoadFlags;
    VALIDATE_NEVER: nsLoadFlags;
    VALIDATE_ONCE_PER_SESSION: nsLoadFlags;
    LOAD_ANONYMOUS: nsLoadFlags;
    LOAD_FRESH_CONNECTION: nsLoadFlags;
  }

  declare export interface nsIRequest {
    // The name of the request.  Often this is the URI of the request.
    name: AUTF8String;
    // The error status associated with the request.
    status: nsresult;
    cancel(status: nsresult): void;
    // Indicates whether the request is pending. isPending is true when there is
    // an outstanding asynchronous event that will make the request no longer be
    // pending. Requests do not necessarily start out pending; in some cases,
    // requests have to be explicitly initiated (for example nsIChannel
    // implementations are only pending once asyncOpen returns successfully).
    // Requests can become pending multiple times during their lifetime.
    isPending(): boolean;
    // Resumes the current request. This may have the effect of re-opening any
    // underlying transport and will resume the delivery of data to any open
    // streams.
    resume(): void;
    // Suspends the current request. This may have the effect of closing any
    // underlying transport (in order to free up resources), although any open
    // streams remain logically opened and will continue delivering data when the
    // transport is resumed.
    //
    // Calling cancel() on a suspended request must not send any notifications
    // (such as onstopRequest) until the request is resumed.
    suspend(): void;

    loadGroup: nsILoadGroup;
    loadFlags: nsLoadFlags;
  }

  /* @flow */

  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIRequestObserver.idl

  declare export interface nsIRequestObserver {
    // Called to signify the beginning of an asynchronous request.
    // Note: An exception thrown from onStartRequest has the side-effect of causing the request to be canceled.
    onStartRequest(request: nsIRequest, context: nsISupports<*>): void;
    // Called to signify the end of an asynchronous request. This call is always
    // preceded by a call to onStartRequest().
    // Note: An exception thrown from onStopRequest is generally ignored.
    onStopRequest(
      request: nsIRequest,
      context: nsISupports<*>,
      status: nsresult
    ): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/9769f2300a17d3dfbebcfb457b1244bd624275e3/netwerk/base/nsILoadGroup.idl

  declare export interface nsILoadGroup extends nsIRequest {
    groupObserver: nsIRequestObserver;
    defaultLoadRequest: nsIRequest;
    requests: nsISimpleEnumerator<nsIRequest>;
    activeCount: long;
    notificationCallbacks: nsIInterfaceRequestor<nsISupports<*>>;
    requestContextID: long;
    defaultLoadFlags: nsLoadFlags;
    userAgentOverrideCache: ACString;

    addRequest(aRequest: nsIRequest, aContext: null | nsISupports<*>): void;
    removeRequest(
      aRequest: nsIRequest,
      aContext: null | nsISupports<*>,
      aStatus: nsresult
    ): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/netwerk/base/nsISecureBrowserUI.idl

  declare export interface nsISecureBrowserUI {
    state: long;

    init(mozIDOMWindowProxy: typeof window): void;
    setDocShell(docShell: nsIDocShell): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIStandardURL.idl

  declare export opaque type nsStandardURLType: long

  declare export interface nsIStandardURLConstants {
    URLTYPE_STANDARD: nsStandardURLType;
    URLTYPE_AUTHORITY: nsStandardURLType;
    URLTYPE_NO_AUTHORITY: nsStandardURLType;
  }

  declare export interface nsIStandardURL extends nsIURL {
    mutable: boolean;
    init(
      urlType: nsStandardURLType,
      defaultPort: number,
      spec: string,
      originCharset: string,
      base: null | nsIURI
    ): void;
  }

  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIStreamListener.idl

  declare export interface nsIStreamListener extends nsIRequestObserver {
    onDataAvailable(
      request: nsIRequest,
      context: nsISupports<*>,
      inputStream: nsIInputStream,
      offset: number,
      count: number
    ): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIURI.idl

  declare export interface nsIURI {
    asciiHost: ACString;
    asciiHostPort: ACString;
    asciiSpec: ACString;
    hasRef: boolean;
    host: AUTF8String;
    hostPort: AUTF8String;
    originCharset: ACString;
    password: AUTF8String;
    path: AUTF8String;
    port: long;
    prePath: AUTF8String;
    ref: AUTF8String;
    scheme: ACString;
    spec: AUTF8String;
    specIgnoringRef: AUTF8String;
    username: AUTF8String;
    userPass: AUTF8String;
    filePath: AUTF8String;
    query: AUTF8String;
    clone(): self;
    cloneIgnoringRef(): self;
    cloneWithNewRef(newRef: AUTF8String): self;
    equals(other: nsIURI): boolean;
    equalsExceptRef(other: nsIURI): boolean;
    resolve(relativePath: AUTF8String): AUTF8String;
    schemeIs(scheme: string): boolean;
    setHostAndPort(hostport: AUTF8String): void;
  }

  declare export interface nsIURISetSpec {
    setSpec(aSpec: AUTF8String): nsIURIMutator;
  }

  declare export interface nsIURISetters extends nsIURISetSpec {
    setScheme(aScheme: AUTF8String): nsIURIMutator;
    setUserPass(aUserPass: AUTF8String): nsIURIMutator;
    setUsername(aUsername: AUTF8String): nsIURIMutator;
    setPassword(aPassword: AUTF8String): nsIURIMutator;
    setHostPort(aHostPort: AUTF8String): nsIURIMutator;
    setHost(aHost: AUTF8String): nsIURIMutator;
    setPort(aPort: long): nsIURIMutator;
    setPathQueryRef(aPathQueryRef: AUTF8String): nsIURIMutator;
    setRef(aRef: AUTF8String): nsIURIMutator;
    setFilePath(aFilePath: AUTF8String): nsIURIMutator;
    setQuery(aQuery: AUTF8String): nsIURIMutator;
  }

  declare export interface nsIURIMutator extends nsIURISetters {
    finalize(): nsIURI;
  }

  declare export interface nsIURLMutator extends nsIURIMutator {
    setFileName(aFileName: AUTF8String): nsIURIMutator;
    setFileBaseName(aFileBaseName: AUTF8String): nsIURIMutator;
    setFileExtension(aFileExtension: AUTF8String): nsIURIMutator;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsIURL.idl

  declare export interface nsIURL extends nsIURI {
    directory: AUTF8String;
    fileName: AUTF8String;
    fileBaseName: AUTF8String;
    fileExtension: AUTF8String;
    getCommonBaseSpec(other: nsIURI): AUTF8String;
    getRelativeSpec(other: nsIURI): AUTF8String;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/6376e59638476407abfd91ea632574a6dd0255a2/netwerk/base/nsIFileURL.idl
  declare export interface nsIFileURL extends nsIURL {
    +file: nsIFile;
  }

  declare export interface nsIStandardURLMutator {
    init(
      aUrlType: long,
      aDefaultPort: long,
      aSpec: AUTF8String,
      aOriginCharset: string,
      aBaseURI: nsIURI | null
    ): nsIURIMutator;
    setDefaultPort(aNewDefaultPort: long): nsIURIMutator;
  }

  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/socket/nsITransportSecurityInfo.idl
  declare export interface nsITransportSecurityInfo {
    securityState: nsWebProgressState;
    errorMessage: wstring;
    errorCode: nsresult;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/uriloader/base/nsIWebProgress.idl

  declare export opaque type nsWebProgressState: long
  declare interface nsIWebProgressConstants {
    NOTIFY_STATE_REQUEST: nsWebProgressState;
    NOTIFY_STATE_DOCUMENT: nsWebProgressState;
    NOTIFY_STATE_NETWORK: nsWebProgressState;
    NOTIFY_STATE_WINDOW: nsWebProgressState;
    NOTIFY_STATE_ALL: nsWebProgressState;
    NOTIFY_PROGRESS: nsWebProgressState;
    NOTIFY_STATUS: nsWebProgressState;
    NOTIFY_SECURITY: nsWebProgressState;
    NOTIFY_LOCATION: nsWebProgressState;
    NOTIFY_REFRESH: nsWebProgressState;
    NOTIFY_ALL: nsWebProgressState;
  }

  declare export interface nsIWebProgress {
    mozIDOMWindowProxy: typeof window;
    DOMWindowID: uint64;
    isTopLevel: boolean;
    isLoadingDocument: boolean;
    loadType: long;

    addProgressListener(
      aListener: nsIWebProgressListener,
      aNotifyMask: long
    ): void;
    removeProgressListener(aListener: nsIWebProgressListener): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/uriloader/base/nsIWebProgressListener.idl

  declare export interface nsIWebProgressListenerConstants {
    // State Transition Flags
    STATE_START: nsWebProgressState;
    STATE_REDIRECTING: nsWebProgressState;
    STATE_TRANSFERRING: nsWebProgressState;
    STATE_NEGOTIATING: nsWebProgressState;
    STATE_STOP: nsWebProgressState;
    // State Type Flags
    STATE_IS_REQUEST: nsWebProgressState;
    STATE_IS_DOCUMEN: nsWebProgressState;
    STATE_IS_NETWORK: nsWebProgressState;
    STATE_IS_WINDOW: nsWebProgressState;
    // State Modifier Flags
    STATE_RESTORING: nsWebProgressState;
    // State Security Flags
    STATE_IS_INSECURE: nsWebProgressState;
    STATE_IS_BROKEN: nsWebProgressState;
    STATE_IS_SECURE: nsWebProgressState;
    // Mixed active content flags
    STATE_BLOCKED_MIXED_ACTIVE_CONTENT: nsWebProgressState;
    STATE_LOADED_MIXED_ACTIVE_CONTENT: nsWebProgressState;
    // Mixed display content flags
    STATE_BLOCKED_MIXED_DISPLAY_CONTEN: nsWebProgressState;
    STATE_LOADED_MIXED_DISPLAY_CONTENT: nsWebProgressState;
    // Tracking content flags
    STATE_BLOCKED_TRACKING_CONTENT: nsWebProgressState;
    STATE_LOADED_TRACKING_CONTENT: nsWebProgressState;
    // Security Strength Flags
    STATE_SECURE_HIGH: nsWebProgressState;
    STATE_SECURE_MED: nsWebProgressState;
    STATE_SECURE_LOW: nsWebProgressState;
    //
    STATE_IDENTITY_EV_TOPLEVEL: nsWebProgressState;
    //  Broken state flags
    STATE_USES_SSL_3: nsWebProgressState;
    STATE_USES_WEAK_CRYPTO: nsWebProgressState;
    STATE_CERT_USER_OVERRIDDEN: nsWebProgressState;

    LOCATION_CHANGE_SAME_DOCUMEN: nsWebProgressState;
    LOCATION_CHANGE_ERROR_PAGE: nsWebProgressState;
  }

  declare export interface nsIWebProgressListener {
    onStateChange(
      aWebProgress: nsIWebProgress,
      aRequest: nsIRequest,
      aStateFlags: nsWebProgressState,
      aStatus: nsresult
    ): void;
    onProgressChange(
      aWebProgress: nsIWebProgress,
      aRequest: nsIRequest,
      aCurSelfProgress: long,
      aMaxSelfProgress: long,
      aCurTotalProgress: long,
      aMaxTotalProgress: long
    ): void;
    onLocationChange(
      aWebProgress: nsIWebProgress,
      aRequest: nsIRequest,
      aLocation: nsIURI,
      aFlags?: nsWebProgressState
    ): void;
    onStatusChange(
      aWebProgress: nsIWebProgress,
      aRequest: nsIRequest,
      aStatus: nsresult,
      aMessage: wstring
    ): void;
    onSecurityChange(
      aWebProgress: nsIWebProgress,
      aRequest: nsIRequest,
      aState: nsWebProgressState
    ): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/caps/nsIDomainPolicy.idl

  declare export interface nsIDomainSet {
    add(aDomain: nsIURI): void;
    remove(aDomain: nsIURI): void;
    clear(): void;
    contains(aDomain: nsIURI): boolean;
    containsSuperDomain(aDomain: nsIURI): boolean;
  }

  declare export interface nsIDomainPolicy {
    blacklist: nsIDomainSet;
    superBlacklist: nsIDomainSet;
    whitelist: nsIDomainSet;
    superWhitelist: nsIDomainSet;

    deactivate(): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/caps/nsIPrincipal.idl

  declare export interface nsIPrincipalContstants {
    APP_STATUS_NOT_INSTALLED: number;
    APP_STATUS_INSTALLED: number;
    APP_STATUS_PRIVILEGED: number;
    APP_STATUS_CERTIFIED: number;
  }

  declare export interface nsIExpandedPrincipal {
    whiteList: Array<nsIPrincipal>;
  }

  declare export interface nsIPrincipal {
    equals(other: nsIPrincipal): boolean;
    equalsConsideringDomain(other: nsIPrincipal): boolean;
    URI: nsIURI;
    subsumes(other: nsIPrincipal): boolean;
    subsumesConsideringDomain(other: nsIPrincipal): boolean;
    checkMayLoad(
      uri: nsIURI,
      report: boolean,
      allowIfInheritsPrincipal: boolean
    ): boolean;
    cspJSON: AString;
    origin: ACString;
    originNoSuffix: ACString;
    originSuffix: AUTF8String;
    baseDomain: ACString;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/caps/nsIScriptSecurityManager.idl

  declare export interface nsIScriptSecurityManagerConstants {
    NO_APP_ID: long;
    UNKNOWN_APP_ID: long;
    SAFEBROWSING_APP_ID: long;
    DEFAULT_USER_CONTEXT_ID: long;
  }

  declare export interface nsIScriptSecurityManager {
    checkLoadURIWithPrincipal(
      aPrincipal: nsIPrincipal,
      uri: nsIURI,
      flags: long
    ): void;
    checkLoadURIStrWithPrincipal(
      aPrincipal: nsIPrincipal,
      uri: AUTF8String,
      flags: long
    ): void;
    getSystemPrincipal(): nsIPrincipal;
    getLoadContextCodebasePrincipal(
      uri: nsIURI,
      loadContext: nsILoadContext
    ): nsIPrincipal;
    getDocShellCodebasePrincipal(
      uri: nsIURI,
      docShell: nsIDocShell
    ): nsIPrincipal;
    createCodebasePrincipal(
      uri: nsIURI,
      originAttributes: Object
    ): nsIPrincipal;
    createCodebasePrincipalFromOrigin(origin: ACString): nsIPrincipal;
    createNullPrincipal(originAttributes: Object): nsIPrincipal;
    createExpandedPrincipal(aPrincipalArray: Array<nsIPrincipal>): nsIPrincipal;
    checkSameOriginURI(
      aSourceURI: nsIURI,
      aTargetURI: nsIURI,
      reportError: boolean
    ): void;
    getChannelResultPrincipal(aChannel: nsIChannel): nsIPrincipal;
    getChannelURIPrincipal(aChannel: nsIChannel): nsIPrincipal;
    isSystemPrincipal(aPrincipal: nsIPrincipal): boolean;
    getJarPrefix(appId: long, inMozBrowser: boolean): AUTF8String;
    activateDomainPolicy(): nsIDomainPolicy;
    domainPolicyActive: boolean;
    policyAllowsScript(aDomain: nsIURI): boolean;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIDocShell.idl

  declare export type nsDocShellType = 0 | 1 | 2
  declare export type nsEnumerationDirection = 0 | 1
  declare export type nsBusyFlag = 0 | 1 | 2 | 3 | 4
  declare export type nsLoadCMD = 0x1 | 0x2 | 0x4 | 0x8
  declare export type nsFrameType = 0 | 1
  declare export type nsTouchEventsOverride = 0 | 1 | 2

  declare export interface nsIDocShellConstants {
    INTERNAL_LOAD_FLAGS_NONE: nsLoadFlags;
    INTERNAL_LOAD_FLAGS_INHERIT_PRINCIPAL: nsLoadFlags;
    INTERNAL_LOAD_FLAGS_DONT_SEND_REFERRER: nsLoadFlags;
    INTERNAL_LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP: nsLoadFlags;
    INTERNAL_LOAD_FLAGS_FIRST_LOAD: nsLoadFlags;
    INTERNAL_LOAD_FLAGS_BYPASS_CLASSIFIER: nsLoadFlags;
    INTERNAL_LOAD_FLAGS_FORCE_ALLOW_COOKIES: nsLoadFlags;
    INTERNAL_LOAD_FLAGS_IS_SRCDOC: nsLoadFlags;
    INTERNAL_LOAD_FLAGS_NO_OPENER: nsLoadFlags;

    ENUMERATE_FORWARDS: nsEnumerationDirection;
    ENUMERATE_BACKWARDS: nsEnumerationDirection;

    APP_TYPE_UNKNOWN: nsDocShellType;
    APP_TYPE_MAIL: nsDocShellType;
    APP_TYPE_EDITOR: nsDocShellType;

    BUSY_FLAGS_NONE: nsBusyFlag;
    BUSY_FLAGS_BUSY: nsBusyFlag;
    BUSY_FLAGS_BEFORE_PAGE_LOAD: nsBusyFlag;
    BUSY_FLAGS_PAGE_LOADING: nsBusyFlag;

    LOAD_CMD_NORMAL: nsLoadCMD;
    LOAD_CMD_RELOAD: nsLoadCMD;
    LOAD_CMD_HISTORY: nsLoadCMD;
    LOAD_CMD_PUSHSTATE: nsLoadCMD;

    FRAME_TYPE_REGULAR: nsFrameType;
    FRAME_TYPE_BROWSER: nsFrameType;

    TOUCHEVENTS_OVERRIDE_DISABLED: nsTouchEventsOverride;
    TOUCHEVENTS_OVERRIDE_ENABLED: nsTouchEventsOverride;
    TOUCHEVENTS_OVERRIDE_NONE: nsTouchEventsOverride;
  }

  declare export type nsIMutableArray<a> = Array<a>

  // See: https://github.com/mozilla/gecko-dev/blob/9769f2300a17d3dfbebcfb457b1244bd624275e3/docshell/shistory/nsISHEntry.idl

  declare export interface nsISHEntry {
    +URI: nsIURI;
    originalURI: nsIURI;
    resultPrincipalURI: nsIURI;
    loadReplace: boolean;
    +title: wstring;
    +isSubFrame: boolean;
    setURI(aURI: nsIURI): void;
    referrerURI: nsIURI;
    referrerPolicy: long;
    contentViewer: nsIContentViewer;
    sticky: boolean;
    windowState: nsISupports<Object>;
    addChildShell(shell: nsIDocShellTreeItem): void;
    childShellAt(index: long): nsIDocShellTreeItem;
    clearChildShells(): void;
    refreshURIList: nsIMutableArray<nsIURI>;
    syncPresentationState(): void;
    setTitle(aTitle: AString): void;
    postData: nsIInputStream;
    // layoutHistoryState: nsILayoutHistoryState;
    // initLayoutHistoryState(): nsILayoutHistoryState;
    parent: nsISHEntry;
    loadType: long;
    ID: long;
    cacheKey: long;
    saveLayoutStateFlag: boolean;
    expirationStatus: boolean;
    contentType: ACString;
    URIWasModified: boolean;
    setScrollPosition(x: long, y: long): void;
    getScrollPosition(): [long, long];
    clone(): nsISHEntry;
    setIsSubFrame(aFlag: boolean): void;
    getAnyContentViewer(ownerEntry: nsISHEntry): nsIContentViewer;
    triggeringPrincipal: nsIPrincipal;
    principalToInherit: nsIPrincipal;
    // stateData: nsIStructuredCloneContainer;
    isDynamicallyAdded(): boolean;
    hasDynamicallyAddedChild(): boolean;
    docshellID: nsIDPtr;
    // +BFCacheEntry: nsIBFCacheEntry;
    adoptBFCacheEntry(aEntry: nsISHEntry): void;
    abandonBFCacheEntry(): void;
    sharesDocumentWith(aEntry: nsISHEntry): void;
    +isSrcdocEntry: boolean;
    srcdocData: ACString;
    baseURI: nsIURI;
    scrollRestorationIsManual: boolean;
    loadedInThisProcess: boolean;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/9769f2300a17d3dfbebcfb457b1244bd624275e3/docshell/base/nsIContentViewer.idl

  declare export type Document = typeof document
  declare export type nsIDOMNode = Node

  declare export interface nsIContentViewer {
    container: nsIDocShell;
    isStopped: boolean;
    +inPermitUnload: boolean;
    permitUnload(aPermitUnloadFlags: long): boolean;
    +beforeUnloadFiring: boolean;
    pageHide(isUnload: boolean): void;
    close(historyEntry: nsISHEntry): void;
    destroy(): void;
    stop(): void;
    +DOMDocument: Document;
    move(aX: long, aY: long): void;
    show(): void;
    hide(): void;
    sticky: boolean;
    requestWindowClose(): boolean;
    open(aState: nsISupports<Object>, aSHEntry: nsISHEntry): void;
    clearHistoryEntry(): void;
    // setPageMode(aPageMode: boolean, aPrintSettings: nsIPrintSettings): void;
    +historyEntry: nsISHEntry;
    +isTabModalPromptAllowed: boolean;
    isHidden: boolean;
    scrollToNode(node: nsIDOMNode): void;
    textZoom: float;
    fullZoom: float;
    +deviceFullZoom: float;
    overrideDPPX: float;
    authorStyleDisabled: boolean;
    forceCharacterSet: ACString;
    hintCharacterSet: ACString;
    hintCharacterSetSource: int32_t;
    getContentSize(): [long, long];
    getContentSizeConstrained(maxWidth: long, maxHeight: long): [long, long];
    minFontSize: long;

    pausePainting(): void;
    resumePainting(): void;
    emulateMedium(aMediaType: ACString): void;
    stopEmulatingMedium(): void;
  }

  declare export interface nsIEditor {
    +selection: Selection;
    setAttributeOrEquivalent(
      element: Element,
      sourceAttrName: AString,
      sourceAttrValue: AString,
      aSuppressTransaction: boolean
    ): void;
    removeAttributeOrEquivalent(
      element: Element,
      sourceAttrName: DOMString,
      aSuppressTransaction: boolean
    ): void;
    preDestroy(aDestroyingFrames: boolean): void;
    flags: long;
    contentsMIMEType: string;
    +isDocumentEditable: boolean;
    +isSelectionEditable: boolean;
    +document: Document;
    +rootElement: Element;
    // +selectionController: nsISelectionController;
    deleteSelection(action: short, stripWrappers: short): void;
    +documentIsEmpty: boolean;
    +documentModified: boolean;
    +documentCharacterSet: ACString;
    resetModificationCount(): void;
    getModificationCount(): long;
    incrementModificationCount(aModCount: long): void;
    // +transactionManager: nsITransactionManager;
    doTransaction(txn: nsITransaction): void;
    enableUndo(enable: boolean): void;
    undo(count: long): void;
    canUndo(): [boolean, boolean];
    redo(count: long): void;
    canRedo(): [boolean, boolean];
    beginTransaction(): void;
    endTransaction(): void;
    shouldTxnSetSelection(): boolean;
    setShouldTxnSetSelection(should: boolean): void;
    // getInlineSpellChecker(autoCreate: boolean): nsIInlineSpellChecker;
    setSpellcheckUserOverride(enable: boolean): void;
    cut(): void;
    canCut(): boolean;
    copy(): void;
    canCopy(): boolean;
    canDelete(): boolean;
    paste(aSelectionType: long): void;
    pasteTransferable(aTransferable: nsITransferable): void;
    canPaste(aSelectionType: long): boolean;
    canPasteTransferable(aTransferable?: nsITransferable): boolean;
    selectAll(): void;
    beginningOfDocument(): void;
    endOfDocument(): void;
    setAttribute(
      aElement: Element,
      attributestr: AString,
      attvalue: AString
    ): void;
    getAttributeValue(
      aElement: Element,
      attributestr: AString,
      { resultValue: AString }
    ): boolean;
    removeAttribute(aElement: Element, aAttribute: AString): void;
    cloneAttribute(
      aAttribute: AString,
      aDestNode: nsIDOMNode,
      aSourceNode: nsIDOMNode
    ): void;
    cloneAttributes(aDestNode: nsIDOMNode, aSourceNode: nsIDOMNode): void;
    insertNode(node: nsIDOMNode, parent: nsIDOMNode, aPosition: long): void;
    splitNode(
      existingRightNode: nsIDOMNode,
      offset: long,
      newLeftNode: nsIDOMNode
    ): void;

    joinNodes(
      leftNode: nsIDOMNode,
      rightNode: nsIDOMNode,
      parent: nsIDOMNode
    ): void;
    deleteNode(child: nsIDOMNode): void;
    markNodeDirty(node: nsIDOMNode): void;
    switchTextDirection(): void;
    outputToString(formatType: AString, flags: long): AString;

    addEditorObserver(observer: nsIEditorObserver): void;

    removeEditorObserver(observer: nsIEditorObserver): void;

    addEditActionListener(listener: nsIEditActionListener): void;

    removeEditActionListener(listener: nsIEditActionListener): void;

    addDocumentStateListener(listener: nsIDocumentStateListener): void;

    removeDocumentStateListener(listener: nsIDocumentStateListener): void;

    dumpContentTree(): void;

    debugDumpContent(): void;

    forceCompositionEnd(): void;

    +composing: boolean;
  }

  declare export interface nsITransaction extends nsISupports<nsITransaction> {
    doTransaction(): void;
    undoTransaction(): void;
    redoTransaction(): void;
    +isTransient: boolean;
    merge(aTransaction: nsITransaction): boolean;
  }

  declare export type nsIArray<a> = Array<a>

  declare export type nsISupportsPrimitives = empty

  declare export interface nsITransferable {
    init(aContext: nsILoadContext): void;
    flavorsTransferableCanExport(): nsIArray<nsISupportsCString>;
    getTransferData(
      aFlavor: string,
      aData: nsISupports<nsISupportsPrimitives>,
      aDataLen: long
    ): void;
    getAnyTransferData({
      aFlavor: ACString,
      aData: nsISupports<nsISupportsPrimitives>,
      aDataLen: long
    }): void;
    isLargeDataSet(): boolean;
    flavorsTransferableCanImport(): nsIArray<nsISupportsCString>;
    setTransferData(
      aFlavor: string,
      aData: nsISupports<nsISupportsPrimitives>,
      aDataLen: long
    ): void;
    addDataFlavor(aDataFlavor: string): void;
    removeDataFlavor(aDataFlavor: string): void;
    converter: nsIFormatConverter<*, *>;
  }

  declare export interface nsIFormatConverter<a, b> {
    getInputDataFlavors(): nsIArray<nsISupportsCString>;
    getOutputDataFlavors(): nsIArray<nsISupportsCString>;
    canConvert(aFromDataFlavor: string, aToDataFlavor: string): boolean;
    convert(
      aFromDataFlavor: string,
      aFromData: nsISupports<a>,
      aDataLen: long,
      aToDataFlavor: string,
      { aToData: nsISupports<b>, aDataToLen: long<number> }
    ): void;
  }

  declare export interface nsIEditorObserver {
    EditAction(): void;
  }

  declare export interface nsIEditActionListener {
    DidCreateNode(
      aTag: DOMString,
      aNewNode: nsIDOMNode,
      aResult: nsresult
    ): void;
    DidInsertNode(aNode: nsIDOMNode, aResult: nsresult): void;
    DidDeleteNode(aChild: nsIDOMNode, aResult: nsresult): void;
    DidSplitNode(
      aExistingRightNode: nsIDOMNode,
      aNewLeftNode: nsIDOMNode
    ): void;
    DidJoinNodes(
      aLeftNode: nsIDOMNode,
      aRightNode: nsIDOMNode,
      aParent: nsIDOMNode,
      aResult: nsresult
    ): void;
    DidInsertText(
      aTextNode: CharacterData,
      aOffset: long,
      aString: DOMString,
      aResult: nsresult
    ): void;
    WillDeleteText(
      aTextNode: CharacterData,
      aOffset: long,
      aLength: long
    ): void;
    DidDeleteText(
      aTextNode: CharacterData,
      aOffset: long,
      aLength: long,
      aResult: nsresult
    ): void;
    WillDeleteSelection(aSelection: Selection): void;
    DidDeleteSelection(aSelection: Selection): void;
  }

  declare export interface nsIDocumentStateListener {
    NotifyDocumentCreated(): void;
    NotifyDocumentWillBeDestroyed(): void;
    NotifyDocumentStateChanged(): void;
  }

  declare export interface nsIDocShell {
    contentViewer: nsIContentViewer;
    customUserAgent: DOMString;
    allowPlugins: boolean;
    allowJavascript: boolean;
    allowMetaRedirects: boolean;
    allowSubframes: boolean;
    allowImages: boolean;
    allowMedia: boolean;
    allowDNSPrefetch: boolean;
    allowWindowControl: boolean;
    allowContentRetargeting: boolean;
    allowContentRetargetingOnChildren: boolean;
    inheritPrivateBrowsingId: boolean;
    appType: nsDocShellType;
    allowAuth: boolean;
    zoom: float;
    marginWidth: long;
    marginHeight: long;
    loadType: nsLoadCMD;
    defaultLoadFlags: nsLoadFlags;
    isExecutingOnLoadHandler: boolean;
    shouldSaveLayoutState: boolean;
    securityUI: nsISecureBrowserUI;
    restoringDocument: boolean;
    useErrorPages: boolean;
    failedChannel: nsIChannel;
    previousTransIndex: long;
    loadedTransIndex: long;
    currentDocumentChannel: nsIChannel;
    isInUnload: boolean;
    channelIsUnsafe: boolean;
    hasMixedActiveContentLoaded: boolean;
    hasMixedActiveContentBlocked: boolean;
    hasMixedDisplayContentLoaded: boolean;
    hasMixedDisplayContentBlocked: boolean;
    hasTrackingContentBlocked: boolean;
    isOffScreenBrowser: boolean;
    // printPreview: nsIWebBrowserPrint;
    canExecuteScripts: boolean;
    isActive: boolean;
    isPrerendered: boolean;
    historyID: nsIDPtr;
    isAppTab: boolean;
    charset: ACString;
    forcedCharset: ACString;
    recordProfileTimelineMarkers: boolean;
    frameType: nsFrameType;
    isMozBrowser: boolean;
    isIsolatedMozBrowserElement: boolean;
    isInIsolatedMozBrowserElement: boolean;
    isInMozBrowser: boolean;
    isTopLevelContentDocShell: boolean;
    asyncPanZoomEnabled: boolean;
    sandboxFlags: long;
    onePermittedSandboxedNavigator: nsIDocShell;
    mixedContentChannel: nsIChannel;
    fullscreenAllowed: boolean;
    mayEnableCharacterEncodingMenu: boolean;
    editor: nsIEditor;
    editable: boolean;
    hasEditingSession: boolean;
    useGlobalHistory: boolean;
    createdDynamically: boolean;
    deviceSizeIsPageSize: boolean;
    hasLoadedNonBlankURI: boolean;
    windowDraggingAllowed: boolean;
    currentScrollRestorationIsManual: boolean;
    // editingSession: nsIEditingSession;
    tabChild: nsITabChild;
    touchEventsOverride: nsTouchEventsOverride;
    isOnlyToplevelInTabGroup: boolean;

    addState<data>(
      aData: data,
      aTitle: string,
      aURL: DOMString,
      aReplace: boolean
    ): void;
    createLoadInfo(): nsIDocShellLoadInfo;
    prepareForNewContentModel(): void;
    setCurrentURI(aURI: nsIURI): void;
    getDocShellEnumerator(
      aItemType: nsDocShellType,
      aDirection: nsEnumerationDirection
    ): nsISimpleEnumerator<nsIDocShell>;
    tabToTreeOwner(forward: boolean, forDocumentNavigation: boolean): boolean;
    isBeingDestroyed(): boolean;
    suspendRefreshURIs(): void;
    resumeRefreshURIs(): void;
    beginRestore(viewer: nsIContentViewer, top: boolean): void;
    finishRestore(): void;
    displayLoadError(
      aError: nsresult,
      aURI: nsIURI,
      aURL: wstring,
      aFailedChannel?: nsIChannel
    ): boolean;
    historyPurged(numEntries: long): void;
    createAboutBlankContentViewer(aPrincipal: nsIPrincipal): void;
    gatherCharsetMenuTelemetry(): void;
    now(): DOMHighResTimeStamp;
    popProfileTimelineMarkers(): Object;
    addWeakPrivacyTransitionObserver(obs: nsIPrivacyTransitionObserver): void;
    addWeakReflowObserver(obs: nsIReflowObserver): void;
    removeWeakReflowObserver(obs: nsIReflowObserver): void;
    getSameTypeParentIgnoreBrowserBoundaries(): nsIDocShell;
    getSameTypeRootTreeItemIgnoreBrowserBoundaries(): nsIDocShell;
    setFullscreenAllowed(allowed: boolean): void;
    makeEditable(inWaitForUriLoad: boolean): void;
    getChildSHEntry(aChildOffset: long): nsISHEntry;
    addChildSHEntry(
      aCloneReference: nsISHEntry,
      aHistoryEntry: nsISHEntry,
      aChildOffset: long,
      aLoadType: long,
      aCloneChilden: boolean
    ): void;
    removeFromSessionHistory(): void;
    getCurrentSHEntry(): nsISHEntry;
    isCommandEnabled(command: string): boolean;
    doCommand(command: string): void;
    doCommandWithParams(command: string, aParams: nsICommandParams): void;
    getOriginAttributes(): Object;
    setOriginAttributes(value: Object): void;
  }

  declare export type nsICommandParams = empty

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIDocShellTreeItem.idl

  declare export type nsDocShellInfoLoadType =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20

  declare export type nsDocShellInfoReferrerPolicy = long

  declare export interface nsIDocShellLoadInfoConstants {
    loadNormal: nsDocShellInfoLoadType; // Normal Load
    loadNormalReplace: nsDocShellInfoLoadType; // Normal Load but replaces current history slot
    loadHistory: nsDocShellInfoLoadType; // Load from history
    loadReloadNormal: nsDocShellInfoLoadType; // Reload
    loadReloadBypassCache: nsDocShellInfoLoadType;
    loadReloadBypassProxy: nsDocShellInfoLoadType;
    loadReloadBypassProxyAndCache: nsDocShellInfoLoadType;
    loadLink: nsDocShellInfoLoadType;
    loadRefresh: nsDocShellInfoLoadType;
    loadReloadCharsetChange: nsDocShellInfoLoadType;
    loadBypassHistory: nsDocShellInfoLoadType;
    loadStopContent: nsDocShellInfoLoadType;
    loadStopContentAndReplace: nsDocShellInfoLoadType;
    loadNormalExternal: nsDocShellInfoLoadType;
    loadNormalBypassCache: nsDocShellInfoLoadType;
    loadNormalBypassProxy: nsDocShellInfoLoadType;
    loadNormalBypassProxyAndCache: nsDocShellInfoLoadType;
    loadPushState: nsDocShellInfoLoadType; // history.pushState or replaceState
    loadReplaceBypassCache: nsDocShellInfoLoadType;
    loadReloadMixedContent: nsDocShellInfoLoadType;
    loadNormalAllowMixedContent: nsDocShellInfoLoadType;
  }

  declare export interface nsIDocShellLoadInfo {
    referrer: nsIURI;
    originalURI: nsIURI;
    loadReplace: boolean;
    triggeringPrincipal: nsIPrincipal;
    inheritPrincipal: boolean;
    principalIsExplicit: boolean;
    loadType: nsDocShellInfoLoadType;
    SHEntry: nsISHEntry;
    target: wstring;
    postDataStream: nsIInputStream;
    sendReferrer: boolean;
    referrerPolicy: nsDocShellInfoReferrerPolicy;
    isSrcdocLoad: boolean;
    srcdocData: AString;
    sourceDocShell: nsIDocShell;
    baseURI: nsIURI;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIDocShellTreeItem.idl

  declare export interface nsIDocShellTreeItemConstants {
    typeChrome: number;
    typeContent: number;
    typeContentWrapper: number;
    typeChromeWrapper: number;
    typeAll: number;
  }

  declare export interface nsIDocShellTreeItem {
    name: AString;
    itemType: long;
    parent: nsIDocShellTreeItem;
    sameTypeParent: nsIDocShellTreeItem;
    rootTreeItem: nsIDocShellTreeItem;
    sameTypeRootTreeItem: nsIDocShellTreeItem;
    treeOwner: nsIDocShellTreeOwner;
    childCount: long;

    nameEquals(other: AString): boolean;
    findItemWithName(
      name: AString,
      aRequestor: nsIDocShellTreeItem,
      aOriginalRequestor: nsIDocShellTreeItem
    ): nsIDocShellTreeItem;
    addChild(child: nsIDocShellTreeItem): void;
    removeChild(child: nsIDocShellTreeItem): void;
    getChildAt(index: long): nsIDocShellTreeItem;
    findChildWithName(
      aName: AString,
      aRecurse: boolean,
      aSameType: boolean,
      aRequestor: nsIDocShellTreeItem,
      aOriginalRequestor: nsIDocShellTreeItem
    ): nsIDocShellTreeItem;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIDocShellTreeOwner.idl

  declare export interface nsIDocShellTreeOwnerConstants {
    typeChrome: number;
    typeContent: number;
    typeContentWrapper: number;
    typeChromeWrapper: number;
    typeAll: number;
  }

  declare export interface nsIDocShellTreeOwner {
    primaryContentShell: nsIDocShellTreeItem;
    primaryTabParent: nsITabParent;
    tabCount: long;
    hasPrimaryContent: boolean;

    contentShellAdded(
      aContentShell: nsIDocShellTreeItem,
      aPrimary: boolean
    ): void;
    contentShellRemoved(aContentShell: nsIDocShellTreeItem): void;
    tabParentAdded(aTab: nsITabParent, aPrimary: boolean): void;
    tabParentRemoved(aTab: nsITabParent): void;
    sizeShellTo(shell: nsIDocShellTreeItem, cx: long, cy: long): void;
    getPrimaryContentSize(width: long, height: long): void;
    setPrimaryContentSize(width: long, height: long): void;
    getRootShellSize(width: long, height: long): void;
    setRootShellSize(width: long, height: long): void;
    setPersistence(
      aPersistPosition: boolean,
      aPersistSize: boolean,
      aPersistSizeMode: boolean
    ): void;
    getPersistence(
      aPersistPosition: boolean,
      aPersistSize: boolean,
      aPersistSizeMode: boolean
    ): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsILoadContext.idl
  declare type mozIDOMWindowProxy = typeof window
  declare type nsIDOMWindow = typeof window

  declare export interface nsILoadContext {
    associatedWindow: mozIDOMWindowProxy;
    topWindow: mozIDOMWindowProxy;
    topFrameElement: Element;
    nestedFrameId: long;
    isContent: boolean;
    usePrivateBrowsing: boolean;
    useRemoteTabs: boolean;
    isInIsolatedMozBrowserElement: boolean;
    originAttributes: Object;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIPrivacyTransitionObserver.idl

  declare export interface nsIPrivacyTransitionObserver {
    privateModeChanged(enabled: boolean): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/base/nsIReflowObserver.idl

  declare export interface nsIReflowObserver {
    reflow(start: DOMHighResTimeStamp, end: DOMHighResTimeStamp): void;
    reflowInterruptible(
      start: DOMHighResTimeStamp,
      end: DOMHighResTimeStamp
    ): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/shistory/nsIPartialSHistory.idl

  declare export interface nsIGroupedSHistory {
    count: long;
    activeFrameLoader: nsIFrameLoader;
    appendPartialSHistory(aPartialHistory: nsIPartialSHistory): void;
    handleSHistoryUpdate(
      aPartialHistory: nsIPartialSHistory,
      aTruncate: boolean
    ): void;
    gotoIndex(aGlobalIndex: long): nsIFrameLoader;
    closeInactiveFrameLoaderOwners(): void;
    addPrerenderingPartialSHistory(
      aPartialHistory: nsIPartialSHistory,
      aId: long
    ): void;
    activatePrerendering(aId: long): nsISupports<*>;
    cancelPrerendering(aId: long): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/docshell/shistory/nsIPartialSHistory.idl

  declare type nsPartialSHistory = 0 | 1 | 2

  declare export type nsIPartialSHistoryConstants = {
    STATE_INACTIVE: nsPartialSHistory,
    STATE_ACTIVE: nsPartialSHistory,
    STATE_PRERENDER: nsPartialSHistory
  }

  declare export interface nsIPartialSHistory {
    count: long;
    globalIndex: long;
    globalIndexOffset: long;
    ownerFrameLoader: nsIFrameLoader;
    groupedSHistory: nsIGroupedSHistory;
    activeState: nsPartialSHistory;
    onAttachGroupedSHistory(aGroup: nsIGroupedSHistory, aOffset: long): void;
    handleSHistoryUpdate(
      aCount: long,
      aLocalIndex: long,
      aTruncate: boolean
    ): void;
    onActive(aGlobalLength: long, aTargetLocalIndex: long): void;
    onDeactive(): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/dom/base/nsIMessageManager.idl

  declare export interface nsIFrameLoaderConstants {
    EVENT_MODE_NORMAL_DISPATCH: number;
    EVENT_MODE_DONT_FORWARD_TO_CHILD: number;
  }

  declare export interface nsIFrameLoader {
    docShell: nsIDocShell;
    tabParent: nsITabParent;
    loadContext: nsILoadContext;
    eventMode: long;
    clipSubdocument: boolean;
    clampScrollPosition: boolean;
    ownerElement: Element;
    childID: long;
    visible: boolean;
    ownerIsMozBrowserFrame: boolean;
    lazyWidth: long;
    lazyHeight: long;
    partialSHistory: nsIPartialSHistory;
    groupedSHistory: nsIGroupedSHistory;
    isDead: boolean;

    loadFrame(): void;
    loadURI(aURI: nsIURI): void;
    setIsPrerendered(): void;
    makePrerenderedLoaderActive(): void;
    appendPartialSHistoryAndSwap(aOther: nsIFrameLoader): Promise<void>;
    requestGroupedHistoryNavigation(aGlobalIndex: long): Promise<void>;
    addProcessChangeBlockingPromise(aPromise: Promise<*>): void;
    destroy(): void;
    depthTooGreat: boolean;
    activateRemoteFrame(): void;
    deactivateRemoteFrame(): void;
    sendCrossProcessMouseEvent(
      aType: string,
      aX: float,
      aY: float,
      aButton: long,
      aClickCount: long,
      aModifiers: long,
      aIgnoreRootScrollFrame?: boolean
    ): void;
    sendCrossProcessKeyEvent(
      aType: string,
      aKeyCode: long,
      aCharCode: long,
      aModifiers: long,
      aPreventDefault?: boolean
    ): void;
    requestNotifyAfterRemotePaint(): void;
    requestFrameLoaderClose(): void;
    print(
      aOuterWindowID: long,
      aPrintSettings: nsIPrintSettings,
      aProgressListener: nsIWebProgressListener
    ): void;
    ensureGroupedSHistory(): nsIGroupedSHistory;
  }

  declare export type nsIPrintSettings = empty

  declare export interface nsIFrameLoaderOwner {
    setIsPrerendered(): void;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/dom/base/nsIMessageManager.idl

  declare export interface nsIContent {
    // TODO: Fix
  }

  declare export interface MessageSpec {
    name: *;
    data: *;
    objects?: *;
    target?: *;
  }

  declare interface nsMessage<message: MessageSpec> {
    name: $PropertyType<message, "name">;
    data: $PropertyType<message, "data">;
    objects: $PropertyType<message, "objects">;
    target: $PropertyType<message, "target">;
    principal: nsIPrincipal;
    sync: boolean;
  }

  declare export interface nsIMessageListener<message: MessageSpec> {
    receiveMessage(message: nsMessage<message>): void;
  }

  declare export interface nsIMessageListenerManager<message: MessageSpec> {
    addMessageListener(
      messageName: $PropertyType<message, "name">,
      listener: nsIMessageListener<message>,
      listenWhenClosed?: boolean
    ): void;
    removeMessageListener(
      messageName: $PropertyType<message, "name">,
      listener: nsIMessageListener<message>
    ): void;
    addWeakMessageListener(
      messageName: $PropertyType<message, "name">,
      listener: nsIMessageListener<message>
    ): void;
    removeWeakMessageListener(
      messageName: $PropertyType<message, "name">,
      listener: nsIMessageListener<message>
    ): void;
  }

  declare export interface nsIMessageSender<message: MessageSpec> {
    processMessageManager: nsIMessageSender<message>;

    sendAsyncMessage(
      messageName: $PropertyType<message, "name">,
      object?: $PropertyType<message, "data">,
      objects?: $PropertyType<message, "objects">,
      principal?: nsIPrincipal
    ): void;
  }

  declare export interface nsIMessageBroadcaster<
    inn: MessageSpec,
    out: MessageSpec
  > extends nsIMessageListenerManager<inn> {
    childCount: long;

    broadcastAsyncMessage(
      messageName: $PropertyType<out, "name">,
      data: $PropertyType<out, "data">,
      objects?: $PropertyType<out, "objects">
    ): void;
    getChildAt(index: long): nsIMessageListenerManager<inn>;
  }

  declare export interface nsISyncMessageSender<message: MessageSpec>
    extends nsIMessageSender<message> {
    sendSyncMessage(
      messageName: $PropertyType<message, "name">,
      data: $PropertyType<message, "data">,
      objects?: $PropertyType<message, "objects">,
      principal?: nsIPrincipal
    ): void;
    sendRpcMessage<out>(
      messageName: $PropertyType<message, "name">,
      data: $PropertyType<message, "data">,
      objects?: $PropertyType<message, "objects">,
      principal?: nsIPrincipal
    ): out;
  }

  declare export interface nsIMessageManagerGlobal<
    inn: MessageSpec,
    out: MessageSpec
  > extends nsIMessageListenerManager<inn>, nsISyncMessageSender<out> {
    dump(string: DOMString): void;
    privateNoteIntentionalCrash(): void;
    atob(aAsciiString: DOMString): DOMString;
    btoa(aBase64Data: DOMString): DOMString;
  }

  declare export interface nsIContentFrameMessageManager<
    inn: MessageSpec,
    out: MessageSpec
  > extends nsIMessageManagerGlobal<inn, out> {
    content: any;
    docShell: nsIDocShell;
  }

  declare export interface nsIInProcessContentFrameMessageManager<
    inn: MessageSpec,
    out: MessageSpec
  > extends nsIContentFrameMessageManager<inn, out> {
    getOwnerContent(): nsIContent;
    cacheFrameLoader(aFrameLoader: nsIFrameLoader): void;
  }

  declare export interface nsIContentProcessMessageManager<
    inn: MessageSpec,
    out: MessageSpec
  > extends nsIMessageManagerGlobal<inn, out> {
    +initialProcessData: Object;
  }

  declare export interface nsIFrameScriptLoader {
    loadFrameScript(
      url: AString,
      aAllowDelayedLoad: boolean,
      aRunInGlobalScope?: boolean
    ): void;
    removeDelayedFrameScript(url: AString): void;
    getDelayedFrameScripts(): Array<[string, boolean]>;
  }

  declare export interface nsIProcessScriptLoader {
    loadProcessScript(aURL: AString, aAllowDelayedLoad: boolean): void;
    removeDelayedProcessScript(aURL: AString): void;
    getDelayedProcessScripts(): Array<string>;
  }

  declare export interface nsIGlobalProcessScriptLoader
    extends nsIProcessScriptLoader {
    +initialProcessData: Object;
  }

  // See:https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/dom/interfaces/base/nsITabChild.idl

  declare export interface nsITabChild {
    tabId: uint64;
    messageManager: nsIContentFrameMessageManager<*, *>;
    // webBrowserChrome: nsIWebBrowserChrome3;
    sendRequestFocus(canFocus: boolean): void;
    sendGetTabCount(tabCount: uint32): void;
  }

  // See:https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/dom/interfaces/base/nsITabParent.idl

  declare export interface nsITabParent {
    useAsyncPanZoom: boolean;
    isPrerendered: boolean;
    tabId: uint64;
    osPid: uint32;
    hasContentOpener: boolean;

    getChildProcessOffset(aCssX: uint32, aCssY: uint32): void;
    preserveLayers(aPreserveLayers: boolean): void;
    suppressDisplayport(aEnabled: boolean): void;
    navigateByKey(aForward: boolean, aForDocumentNavigation: boolean): void;
  }

  // See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIAsyncInputStream.idl

  declare export interface nsIInputStreamCallback {
    onInputStreamReady(aStream: nsIAsyncInputStream): void;
  }

  declare export interface nsIAsyncInputStreamConstants {
    WAIT_CLOSURE_ONLY: long;
  }

  declare export interface nsIAsyncInputStream extends nsIInputStream {
    // This method closes the stream and sets its internal status.  If the
    // stream is already closed, then this method is ignored.  Once the stream
    // is closed, the stream's status cannot be changed.  Any successful status
    // code passed to this method is treated as NS_BASE_STREAM_CLOSED, which
    // has an effect equivalent to nsIInputStream::close.
    closeWithStatus(aStatus: nsresult): void;
    asyncWait(
      aCallback: nsIInputStreamCallback,
      aFlags: long,
      aRequestedCount: long,
      aEventTarget: nsIEventTarget
    ): void;
  }

  // See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIAsyncOutputStream.idl

  declare export interface nsIOutputStreamCallback {
    onOutputStreamReady(aStream: nsIAsyncOutputStream): void;
  }

  declare export interface nsIAsyncOutputStreamConstants {
    WAIT_CLOSURE_ONLY: long;
  }

  declare export interface nsIAsyncOutputStream extends nsIOutputStream {
    // This method closes the stream and sets its internal status.  If the
    // stream is already closed, then this method is ignored.  Once the stream
    // is closed, the stream's status cannot be changed.  Any successful status
    // code passed to this method is treated as NS_BASE_STREAM_CLOSED, which
    // has an effect equivalent to nsIInputStream::close.
    closeWithStatus(aStatus: nsresult): void;
    asyncWait(
      aCallback: nsIOutputStreamCallback,
      aFlags: long,
      aRequestedCount: long,
      aEventTarget: nsIEventTarget
    ): void;
  }

  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/io/nsIScriptableInputStream.idl

  declare export interface nsIBinaryInputStream extends nsIInputStream {
    setInputStream(inputStream: nsIInputStream): void;
    read8(): uint8;
    read16(): uint16;
    read32(): uint32;
    read64(): uint64;
    readBoolean(): boolean;
    readByteArray(length: number): Array<uint8>;
    readBytes(length: number): string;
    readCString(): ACString;
    readDouble(): double;
    readFloat(): float;
    readString(): AString;
  }

  // See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIBinaryOutputStream.idl

  declare export interface nsIBinaryOutputStream extends nsIOutputStream {
    setOutputStream(aOutputStream: nsIOutputStream): void;
    writeBoolean(aBoolean: boolean): void;
    write8(aByte: uint8): void;
    write16(a16: uint16): void;
    write32(a32: uint32): void;
    write64(a64: uint64): void;
    writeFloat(aFloat: float): void;
    writeDouble(aDouble: double): void;
    writeStringZ(aString: string): void;
    writeWStringZ(aString: wstring): void;
    writeUtf8Z(aString: wstring): void;
    writeBytes(aString: string, aLength: uint32): void;
    writeByteArray(aBytes: Array<uint8>, aLength: uint32): void;
  }

  declare export interface nsIArrayBufferInputStream extends nsIInputStream {
    setData(buffer: ArrayBuffer, byteOffset: long, byteLength: long): void;
  }

  // See https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/io/nsIFile.idl

  declare export interface nsIFileConstants {
    OS_READAHEAD: number;
    DELETE_ON_CLOSE: number;
    NORMAL_FILE_TYPE: number;
    DIRECTORY_TYPE: number;
  }

  declare export interface nsIFile {
    permissions: long;
    leafName: string;
    permissionsOfLink: long;
    lastModifiedTime: PRTime;
    lastModifiedTimeOfLink: PRTime;
    fileSize: uint64;
    fileSizeOfLink: uint64;
    target: AString;
    path: AString;
    parent: nsIFile;
    directoryEntries: nsISimpleEnumerator<nsIFile>;
    followLinks: boolean;
    persistentDescriptor: ACString;

    append(node: string): void;
    normalize(): void;
    create(type: long, permissions: long): void;
    copyTo(newParentDir: nsIFile, newName: string): void;
    copyToFollowingLinks(newParentDir: nsIFile, newName: string): void;
    moveTo(newParentDir: nsIFile, newName: AString): void;
    renameTo(newParentDir: nsIFile, newName: AString): void;
    remove(recursive: boolean): boolean;
    exists(): boolean;
    isWritable(): boolean;
    isReadable(): boolean;
    isExecutable(): boolean;
    isHidden(): boolean;
    isDirectory(): boolean;
    isFile(): boolean;
    isSymlink(): boolean;
    isSpecial(): boolean;
    createUnique(typ: long, permission: long): void;
    clone(): nsIFile;
    equals(other: nsIFile): boolean;
    contains(other: nsIFile): boolean;
    initWithPath(filePath: string): void;
    initWithFile(file: nsIFile): void;
    appendRelativePath(relativeFilePath: AString): void;
    reveal(): void;
    launch(): void;
    getRelativeDescriptor(fromFile: nsIFile): ACString;
    setRelativeDescriptor(fromFile: nsIFile, relativeDesc: ACString): void;
    getRelativePath(fromFile: nsIFile): AUTF8String;
    setRelativePath(fromFile: nsIFile, relativeDesc: AUTF8String): void;
  }

  declare export interface nsILocalFile extends nsIFile {
    appendRelativePath(AString): void;
    getRelativeDescriptor(nsILocalFile): ACString;
    initWithFile(nsILocalFile): void;
    initWithPath(ACString): void;
    launch(): void;
    reveal(): void;
    setRelativeDescriptor(nsILocalFile, ACString): void;
  }

  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/io/nsIInputStream.idl

  declare export interface nsIInputStream {
    // Determine number of bytes available in the stream.

    // In addition to the number of bytes available in the stream, this method
    // also informs the caller of the current status of the stream. A stream that
    // is closed will throw an exception when this method is called. That enables
    // the caller to know the condition of the stream before attempting to read
    // from it. If a stream is at end-of-file, but not closed, then this method
    // returns 0 bytes available.
    //
    // Note: Some nsIInputStream implementations automatically close() when
    // end-of-file is reached; others do not.
    //
    // Note: This method should not be used to determine the total size of a
    // stream, even if the stream corresponds to a local file. Moreover, since a
    // stream may make available more than 2^32 bytes of data, this method is
    // incapable of expressing the entire size of the underlying data source.
    available(): number;
    // Close the stream. This method causes subsequent calls to read() and
    // readSegments() to return 0 bytes read to indicate end-of-file.
    //
    // Note: The close method may be called more than once, but subsequent calls
    // are ignored.
    close(): void;
    // Returns true if stream is non-blocking.
    isNonBlocking(): boolean;
  }

  // See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIOutputStream.idl

  declare export interface nsIOutputStream {
    // Close the stream. Forces the output stream to flush any buffered data.
    // Throws `NS_BASE_STREAM_WOULD_BLOCK` if unable to flush without blocking
    // the calling thread (non-blocking mode only)
    close(): void;
    // Flush the stream.
    // Throws `NS_BASE_STREAM_WOULD_BLOCK` if unable to flush without blocking
    // the calling thread (non-blocking mode only).
    flush(): void;
    // Write data into the stream.
    //
    // @param aBuf the buffer containing the data to be written
    // @param aCount the maximum number of bytes to be written
    //
    // @return number of bytes written (may be less than aCount)
    //
    // @throws NS_BASE_STREAM_WOULD_BLOCK if writing to the output stream would
    // block the calling thread (non-blocking mode only)
    // @throws <other-error> on failure
    write(aBuf: string, aCount: long): long;
    // Writes data into the stream from an input stream.
    //
    // @param aFromStream the stream containing the data to be written
    // @param aCount the maximum number of bytes to be written
    //
    // @return number of bytes written (may be less than aCount)
    //
    // @throws NS_BASE_STREAM_WOULD_BLOCK if writing to the output stream would
    // block the calling thread (non-blocking mode only). This failure
    // means no bytes were transferred.
    // @throws <other-error> on failure
    //
    // NOTE: This method is defined by this interface in order to allow the
    // output stream to efficiently copy the data from the input stream into
    // its internal buffer (if any). If this method was provided as an external
    // facility, a separate char* buffer would need to be used in order to call
    // the output stream's other Write method.
    writeFrom(aFromStream: nsIInputStream, aCount: long): long;
    // @return true if stream is non-blocking
    //
    // NOTE: writing to a blocking output stream will block the calling thread
    // until all given data can be consumed by the stream.
    //
    // NOTE: a non-blocking output stream may implement nsIAsyncOutputStream to
    // provide consumers with a way to wait for the stream to accept more data
    // once its write method is unable to accept any data without blocking.
    isNonBlocking(): boolean;
  }

  // See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/io/nsIPipe.idl

  declare export interface nsIPipe {
    init(
      nonBlockingInput: boolean,
      nonBlockingOutput: boolean,
      segmentSize: long,
      segmentCount: long
    ): void;
    inputStream: nsIAsyncInputStream;
    outputStream: nsIAsyncOutputStream;
  }

  // See https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/xpcom/io/nsIScriptableInputStream.idl

  declare export interface nsIScriptableInputStream extends nsIInputStream {
    // Wrap the given nsIInputStream with this nsIScriptableInputStream.
    // Note: The init method may be called more than once, allowing a
    // nsIScriptableInputStream instance to be reused.
    init(inputStream: nsIInputStream): void;
    // Read data from the stream.
    // Warning: If the data contains a null byte, then this method will return a
    // truncated string.
    // returns a string, which will be an empty string if the stream is at EOF.
    // Throws exception:
    //  - NS_ERROR_NOT_INITIALIZED
    //    If init() was not called.
    //  - NS_BASE_STREAM_CLOSED
    //    If called after the stream has been closed.
    //  - NS_BASE_STREAM_WOULD_BLOCK
    //    Indicates that reading from the input stream would block the calling
    //    thread for an indeterminate amount of time. This exception may only be
    //    thrown if nsIInputStream.isNonBlocking() returns true.
    read(count: number): string;
    // Read data from the stream, including null bytes.
    // Throws exception:
    //  - NS_ERROR_FAILURE
    //    If there are not enough bytes available to read aCount amount of data.
    //  - NS_BASE_STREAM_WOULD_BLOCK
    //    Indicates that reading from the input stream would block the calling
    //    thread for an indeterminate amount of time. This exception may only be
    //    thrown if nsIInputStream.isNonBlocking() returns true.
    readByte(count: number): ACString;
  }

  // See https://github.com/mozilla/gecko-dev/blob/7adb57a57f9a4a7968b9d9d05f916786ba029a55/xpcom/system/nsIXULRuntime.idl

  declare export type nsProcessType = 0 | 1 | 2 | 3 | 4 | 5

  declare export interface nsIXULRuntimeConstants {
    PROCESS_TYPE_DEFAULT: nsProcessType;
    PROCESS_TYPE_PLUGIN: nsProcessType;
    PROCESS_TYPE_CONTENT: nsProcessType;
    PROCESS_TYPE_IPDLUNITTEST: nsProcessType;
    PROCESS_TYPE_GMPLUGIN: nsProcessType;
    PROCESS_TYPE_GPU: nsProcessType;
  }

  declare export interface nsIXULRuntime {
    inSafeMode: boolean;
    logConsoleErrors: boolean;
    OS: AUTF8String;
    XPCOMABI: AUTF8String;
    widgetToolkit: AUTF8String;
    processType: nsProcessType;
    processID: long;
    uniqueProcessID: long;
    remoteType: DOMString;
    browserTabsRemoteAutostart: boolean;
    multiprocessBlockPolicy: long;
    accessibilityEnabled: boolean;
    is64Bit: boolean;
    replacedLockTime: PRTime;
    lastRunCrashID: DOMString;
    isReleaseOrBeta: boolean;
    isOfficialBranding: boolean;
    defaultUpdateChannel: AUTF8String;
    distributionID: AUTF8String;
    isOfficial: boolean;
    windowsDLLBlocklistStatus: boolean;

    invalidateCachesOnRestart(): void;
    ensureContentProcess(): void;
  }

  declare export interface nsIXULAppInfo {
    appBuildID: ACString;
    ID: ACString;
    name: ACString;
    platformBuildID: ACString;
    platformVersion: ACString;
    vendor: ACString;
    version: ACString;
  }

  declare export interface nsIFilePicker {
    addToRecentDocs: boolean;
    defaultExtension: AString;
    defaultString: AString;
    displayDirectory: nsILocalFile;
    +file: nsILocalFile;
    +files: nsISimpleEnumerator<nsILocalFile>;
    +fileURL: nsIURI;
    filterIndex: long;

    appendFilter(title: AString, filter: AString): void;
    appendFilters(filterMask: nsFilePickerFilter): void;
    init(parent: nsIDOMWindow, title: AString, mode: nsFilePickerMode): void;
    open(nsIFilePickerShownCallback): void;
  }

  declare export type nsIFilePickerShownCallback = nsFilePickerReturn => void | {
    don(nsFilePickerReturn): void
  }

  declare export opaque type nsFilePickerMode: long
  declare export type nsFilePickerReturn = 0 | 1 | 2
  declare export opaque type nsFilePickerFilter: long

  declare export interface nsIFilePickerConstants {
    modeOpen: nsFilePickerMode;
    modeSave: nsFilePickerMode;
    modeGetFolder: nsFilePickerMode;
    modeOpenMultiple: nsFilePickerMode;

    returnOK: 0;
    returnCancel: 1;
    returnReplace: 2;

    filterAll: nsFilePickerFilter;
    filterHTML: nsFilePickerFilter;
    filterText: nsFilePickerFilter;
    filterImages: nsFilePickerFilter;
    filterXML: nsFilePickerFilter;
    filterXUL: nsFilePickerFilter;
    filterApps: nsFilePickerFilter;
    filterAllowURLs: nsFilePickerFilter;
    filterAudio: nsFilePickerFilter;
    filterVideo: nsFilePickerFilter;
  }

  // See https://github.com/mozilla/gecko-dev/blob/86897859913403b68829dbf9a154f5a87c4b0638/xpcom/threads/nsIEventTarget.idl

  declare export type nsDispatchType = 0 | 1 | 2

  declare export interface nsIEventTargetConstants {
    DISPATCH_NORMAL: nsDispatchType;
    DISPATCH_SYNC: nsDispatchType;
    DISPATCH_AT_END: nsDispatchType;
  }

  declare export interface nsIEventTarget {
    isOnCurrentThread(): boolean;
  }

  declare export interface nsIStackFrame {
    +caller: nsIStackFrame;
    +filename: string;
    +language: PRUint32;
    +languageName: string;
    +lineNumber: PRInt32;
    +name: string;
    +sourceLine: string;
  }

  // See: https://github.com/mozilla/gecko-dev/blob/374b919ce68bbfc3f9d13068e104ec15891a6f03/dom/interfaces/security/nsIContentSecurityManager.idl
  declare export interface nsIContentSecurityManager {
    performSecurityCheck(
      aChannel: nsIChannel,
      aStreamListener: ?nsIStreamListener
    ): nsIStreamListener;
    isOriginPotentiallyTrustworthy(aPrincipal: nsIPrincipal): boolean;
  }

  // -------------------------
  declare export type JSM<url: string, jsm> = (url, {}) => jsm

  declare export var Components: {
    results: {
      NS_ERROR_XPC_NOT_ENOUGH_ARGS: 2153185281,
      NS_ERROR_XPC_NEED_OUT_OBJECT: 2153185282,
      NS_ERROR_XPC_CANT_SET_OUT_VAL: 2153185283,
      NS_ERROR_XPC_NATIVE_RETURNED_FAILURE: 2153185284,
      NS_ERROR_XPC_CANT_GET_INTERFACE_INFO: 2153185285,
      NS_ERROR_XPC_CANT_GET_PARAM_IFACE_INFO: 2153185286,
      NS_ERROR_XPC_CANT_GET_METHOD_INFO: 2153185287,
      NS_ERROR_XPC_UNEXPECTED: 2153185288,
      NS_ERROR_XPC_BAD_CONVERT_JS: 2153185289,
      NS_ERROR_XPC_BAD_CONVERT_NATIVE: 2153185290,
      NS_ERROR_XPC_BAD_CONVERT_JS_NULL_REF: 2153185291,
      NS_ERROR_XPC_BAD_OP_ON_WN_PROTO: 2153185292,
      NS_ERROR_XPC_CANT_CONVERT_WN_TO_FUN: 2153185293,
      NS_ERROR_XPC_CANT_DEFINE_PROP_ON_WN: 2153185294,
      NS_ERROR_XPC_CANT_WATCH_WN_STATIC: 2153185295,
      NS_ERROR_XPC_CANT_EXPORT_WN_STATIC: 2153185296,
      NS_ERROR_XPC_SCRIPTABLE_CALL_FAILED: 2153185297,
      NS_ERROR_XPC_SCRIPTABLE_CTOR_FAILED: 2153185298,
      NS_ERROR_XPC_CANT_CALL_WO_SCRIPTABLE: 2153185299,
      NS_ERROR_XPC_CANT_CTOR_WO_SCRIPTABLE: 2153185300,
      NS_ERROR_XPC_CI_RETURNED_FAILURE: 2153185301,
      NS_ERROR_XPC_GS_RETURNED_FAILURE: 2153185302,
      NS_ERROR_XPC_BAD_CID: 2153185303,
      NS_ERROR_XPC_BAD_IID: 2153185304,
      NS_ERROR_XPC_CANT_CREATE_WN: 2153185305,
      NS_ERROR_XPC_JS_THREW_EXCEPTION: 2153185306,
      NS_ERROR_XPC_JS_THREW_NATIVE_OBJECT: 2153185307,
      NS_ERROR_XPC_JS_THREW_JS_OBJECT: 2153185308,
      NS_ERROR_XPC_JS_THREW_NULL: 2153185309,
      NS_ERROR_XPC_JS_THREW_STRING: 2153185310,
      NS_ERROR_XPC_JS_THREW_NUMBER: 2153185311,
      NS_ERROR_XPC_JAVASCRIPT_ERROR: 2153185312,
      NS_ERROR_XPC_JAVASCRIPT_ERROR_WITH_DETAILS: 2153185313,
      NS_ERROR_XPC_CANT_CONVERT_PRIMITIVE_TO_ARRAY: 2153185314,
      NS_ERROR_XPC_CANT_CONVERT_OBJECT_TO_ARRAY: 2153185315,
      NS_ERROR_XPC_NOT_ENOUGH_ELEMENTS_IN_ARRAY: 2153185316,
      NS_ERROR_XPC_CANT_GET_ARRAY_INFO: 2153185317,
      NS_ERROR_XPC_NOT_ENOUGH_CHARS_IN_STRING: 2153185318,
      NS_ERROR_XPC_SECURITY_MANAGER_VETO: 2153185319,
      NS_ERROR_XPC_INTERFACE_NOT_SCRIPTABLE: 2153185320,
      NS_ERROR_XPC_INTERFACE_NOT_FROM_NSISUPPORTS: 2153185321,
      NS_ERROR_XPC_CANT_GET_JSOBJECT_OF_DOM_OBJECT: 2153185322,
      NS_ERROR_XPC_CANT_SET_READ_ONLY_CONSTANT: 2153185323,
      NS_ERROR_XPC_CANT_SET_READ_ONLY_ATTRIBUTE: 2153185324,
      NS_ERROR_XPC_CANT_SET_READ_ONLY_METHOD: 2153185325,
      NS_ERROR_XPC_CANT_ADD_PROP_TO_WRAPPED_NATIVE: 2153185326,
      NS_ERROR_XPC_CALL_TO_SCRIPTABLE_FAILED: 2153185327,
      NS_ERROR_XPC_JSOBJECT_HAS_NO_FUNCTION_NAMED: 2153185328,
      NS_ERROR_XPC_BAD_ID_STRING: 2153185329,
      NS_ERROR_XPC_BAD_INITIALIZER_NAME: 2153185330,
      NS_ERROR_XPC_HAS_BEEN_SHUTDOWN: 2153185331,
      NS_ERROR_XPC_CANT_MODIFY_PROP_ON_WN: 2153185332,
      NS_ERROR_XPC_BAD_CONVERT_JS_ZERO_ISNOT_NULL: 2153185333,
      NS_ERROR_XPC_CANT_PASS_CPOW_TO_NATIVE: 2153185334,
      NS_OK: 0,
      NS_ERROR_NOT_INITIALIZED: 3253927937,
      NS_ERROR_ALREADY_INITIALIZED: 3253927938,
      NS_ERROR_NOT_IMPLEMENTED: 2147500033,
      NS_NOINTERFACE: 2147500034,
      NS_ERROR_NO_INTERFACE: 2147500034,
      NS_ERROR_ILLEGAL_VALUE: 2147942487,
      NS_ERROR_INVALID_POINTER: 2147942487,
      NS_ERROR_NULL_POINTER: 2147942487,
      NS_ERROR_ABORT: 2147500036,
      NS_ERROR_FAILURE: 2147500037,
      NS_ERROR_UNEXPECTED: 2147549183,
      NS_ERROR_OUT_OF_MEMORY: 2147942414,
      NS_ERROR_INVALID_ARG: 2147942487,
      NS_ERROR_NO_AGGREGATION: 2147746064,
      NS_ERROR_NOT_AVAILABLE: 2147746065,
      NS_ERROR_FACTORY_NOT_REGISTERED: 2147746132,
      NS_ERROR_FACTORY_REGISTER_AGAIN: 2147746133,
      NS_ERROR_FACTORY_NOT_LOADED: 2147746296,
      NS_ERROR_FACTORY_NO_SIGNATURE_SUPPORT: 3253928193,
      NS_ERROR_FACTORY_EXISTS: 3253928192,
      NS_BASE_STREAM_CLOSED: 2152136706,
      NS_BASE_STREAM_OSERROR: 2152136707,
      NS_BASE_STREAM_ILLEGAL_ARGS: 2152136708,
      NS_BASE_STREAM_NO_CONVERTER: 2152136709,
      NS_BASE_STREAM_BAD_CONVERSION: 2152136710,
      NS_BASE_STREAM_WOULD_BLOCK: 2152136711,
      NS_ERROR_FILE_UNRECOGNIZED_PATH: 2152857601,
      NS_ERROR_FILE_UNRESOLVABLE_SYMLINK: 2152857602,
      NS_ERROR_FILE_EXECUTION_FAILED: 2152857603,
      NS_ERROR_FILE_UNKNOWN_TYPE: 2152857604,
      NS_ERROR_FILE_DESTINATION_NOT_DIR: 2152857605,
      NS_ERROR_FILE_TARGET_DOES_NOT_EXIST: 2152857606,
      NS_ERROR_FILE_COPY_OR_MOVE_FAILED: 2152857607,
      NS_ERROR_FILE_ALREADY_EXISTS: 2152857608,
      NS_ERROR_FILE_INVALID_PATH: 2152857609,
      NS_ERROR_FILE_DISK_FULL: 2152857610,
      NS_ERROR_FILE_CORRUPTED: 2152857611,
      NS_ERROR_FILE_NOT_DIRECTORY: 2152857612,
      NS_ERROR_FILE_IS_DIRECTORY: 2152857613,
      NS_ERROR_FILE_IS_LOCKED: 2152857614,
      NS_ERROR_FILE_TOO_BIG: 2152857615,
      NS_ERROR_FILE_NO_DEVICE_SPACE: 2152857616,
      NS_ERROR_FILE_NAME_TOO_LONG: 2152857617,
      NS_ERROR_FILE_NOT_FOUND: 2152857618,
      NS_ERROR_FILE_READ_ONLY: 2152857619,
      NS_ERROR_FILE_DIR_NOT_EMPTY: 2152857620,
      NS_ERROR_FILE_ACCESS_DENIED: 2152857621,
      NS_ERROR_CANNOT_CONVERT_DATA: 2152071169,
      NS_ERROR_OBJECT_IS_IMMUTABLE: 2152071170,
      NS_ERROR_LOSS_OF_SIGNIFICANT_DATA: 2152071171,
      NS_SUCCESS_LOSS_OF_INSIGNIFICANT_DATA: 4587521,
      NS_BINDING_FAILED: 2152398849,
      NS_BINDING_ABORTED: 2152398850,
      NS_BINDING_REDIRECTED: 2152398851,
      NS_BINDING_RETARGETED: 2152398852,
      NS_ERROR_MALFORMED_URI: 2152398858,
      NS_ERROR_UNKNOWN_PROTOCOL: 2152398866,
      NS_ERROR_NO_CONTENT: 2152398865,
      NS_ERROR_IN_PROGRESS: 2152398863,
      NS_ERROR_ALREADY_OPENED: 2152398921,
      NS_ERROR_INVALID_CONTENT_ENCODING: 2152398875,
      NS_ERROR_CORRUPTED_CONTENT: 2152398877,
      NS_ERROR_FIRST_HEADER_FIELD_COMPONENT_EMPTY: 2152398882,
      NS_ERROR_ALREADY_CONNECTED: 2152398859,
      NS_ERROR_NOT_CONNECTED: 2152398860,
      NS_ERROR_CONNECTION_REFUSED: 2152398861,
      NS_ERROR_PROXY_CONNECTION_REFUSED: 2152398920,
      NS_ERROR_NET_TIMEOUT: 2152398862,
      NS_ERROR_OFFLINE: 2152398864,
      NS_ERROR_PORT_ACCESS_NOT_ALLOWED: 2152398867,
      NS_ERROR_NET_RESET: 2152398868,
      NS_ERROR_NET_INTERRUPT: 2152398919,
      NS_ERROR_NET_PARTIAL_TRANSFER: 2152398924,
      NS_ERROR_NOT_RESUMABLE: 2152398873,
      NS_ERROR_ENTITY_CHANGED: 2152398880,
      NS_ERROR_REDIRECT_LOOP: 2152398879,
      NS_ERROR_UNSAFE_CONTENT_TYPE: 2152398922,
      NS_ERROR_REMOTE_XUL: 2152398923,
      NS_ERROR_LOAD_SHOWED_ERRORPAGE: 2152398925,
      NS_ERROR_BLOCKED_BY_POLICY: 2155347971,
      NS_ERROR_FTP_LOGIN: 2152398869,
      NS_ERROR_FTP_CWD: 2152398870,
      NS_ERROR_FTP_PASV: 2152398871,
      NS_ERROR_FTP_PWD: 2152398872,
      NS_ERROR_FTP_LIST: 2152398876,
      NS_ERROR_UNKNOWN_HOST: 2152398878,
      NS_ERROR_DNS_LOOKUP_QUEUE_FULL: 2152398881,
      NS_ERROR_UNKNOWN_PROXY_HOST: 2152398890,
      NS_ERROR_UNKNOWN_SOCKET_TYPE: 2152398899,
      NS_ERROR_SOCKET_CREATE_FAILED: 2152398900,
      NS_ERROR_SOCKET_ADDRESS_NOT_SUPPORTED: 2152398901,
      NS_ERROR_SOCKET_ADDRESS_IN_USE: 2152398902,
      NS_ERROR_CACHE_KEY_NOT_FOUND: 2152398909,
      NS_ERROR_CACHE_DATA_IS_STREAM: 2152398910,
      NS_ERROR_CACHE_DATA_IS_NOT_STREAM: 2152398911,
      NS_ERROR_CACHE_WAIT_FOR_VALIDATION: 2152398912,
      NS_ERROR_CACHE_ENTRY_DOOMED: 2152398913,
      NS_ERROR_CACHE_READ_ACCESS_DENIED: 2152398914,
      NS_ERROR_CACHE_WRITE_ACCESS_DENIED: 2152398915,
      NS_ERROR_CACHE_IN_USE: 2152398916,
      NS_ERROR_DOCUMENT_NOT_CACHED: 2152398918,
      NS_ERROR_INSUFFICIENT_DOMAIN_LEVELS: 2152398928,
      NS_ERROR_HOST_IS_IP_ADDRESS: 2152398929,
      NS_ERROR_NOT_SAME_THREAD: 2152071172,
      NS_ERROR_STORAGE_BUSY: 2153971713,
      NS_ERROR_STORAGE_IOERR: 2153971714,
      NS_ERROR_STORAGE_CONSTRAINT: 2153971715,
      NS_ERROR_PLUGIN_TIME_RANGE_NOT_SUPPORTED: 2152465387,
      NS_ERROR_ILLEGAL_INPUT: 2152726542,
      NS_ERROR_SIGNED_JAR_NOT_SIGNED: 2154299393,
      NS_ERROR_SIGNED_JAR_MODIFIED_ENTRY: 2154299394,
      NS_ERROR_SIGNED_JAR_UNSIGNED_ENTRY: 2154299395,
      NS_ERROR_SIGNED_JAR_ENTRY_MISSING: 2154299396,
      NS_ERROR_SIGNED_JAR_WRONG_SIGNATURE: 2154299397,
      NS_ERROR_SIGNED_JAR_ENTRY_TOO_LARGE: 2154299398,
      NS_ERROR_SIGNED_JAR_ENTRY_INVALID: 2154299399,
      NS_ERROR_SIGNED_JAR_MANIFEST_INVALID: 2154299400,
      NS_ERROR_CMS_VERIFY_NOT_SIGNED: 2153382912,
      NS_ERROR_SIGNED_APP_MANIFEST_INVALID: 2154496001,
      NS_ERROR_GFX_PRINTER_NO_PRINTER_AVAILABLE: 2152202241,
      NS_ERROR_GFX_PRINTER_NAME_NOT_FOUND: 2152202242,
      NS_ERROR_GFX_PRINTER_COULD_NOT_OPEN_FILE: 2152202243,
      NS_ERROR_GFX_PRINTER_STARTDOC: 2152202244,
      NS_ERROR_GFX_PRINTER_ENDDOC: 2152202245,
      NS_ERROR_GFX_PRINTER_STARTPAGE: 2152202246,
      NS_ERROR_GFX_PRINTER_DOC_IS_BUSY: 2152202247,
      NS_ERROR_CONTENT_CRASHED: 2153644048,
      NS_ERROR_BUILDID_MISMATCH: 2153644049,
      NS_ERROR_DOM_PUSH_INVALID_KEY_ERR: 2154627077,
      NS_ERROR_DOM_PUSH_MISMATCHED_KEY_ERR: 2154627078,
      NS_ERROR_DOM_NOT_FOUND_ERR: 2152923144,
      NS_ERROR_DOM_NOT_ALLOWED_ERR: 2152923169,
      NS_ERROR_MALWARE_URI: 2153578526,
      NS_ERROR_PHISHING_URI: 2153578527,
      NS_ERROR_TRACKING_URI: 2153578530,
      NS_ERROR_UNWANTED_URI: 2153578531,
      NS_ERROR_BLOCKED_URI: 2153578533,
      NS_ERROR_HARMFUL_URI: 2153578534
    },
    interfaces: {
      nsIDomainSet: nsIJSID<nsIDomainSet>,
      nsIDomainPolicy: nsIJSID<nsIDomainPolicy>,
      nsIPrincipal: nsIJSID<nsIPrincipal> & nsIPrincipalContstants,
      nsIScriptSecurityManager: nsIJSID<nsIScriptSecurityManager> &
        nsIScriptSecurityManagerConstants,

      nsIMessageListener: nsIJSID<nsIMessageListener<*>>,
      nsIMessageListenerManager: nsIJSID<nsIMessageListenerManager<*>>,
      nsIMessageSender: nsIJSID<nsIMessageSender<*>>,
      nsIMessageBroadcaster: nsIJSID<nsIMessageBroadcaster<*, *>>,
      nsISyncMessageSender: nsIJSID<nsISyncMessageSender<*>>,
      nsIMessageManagerGlobal: nsIJSID<nsIMessageManagerGlobal<*, *>>,
      nsIContentFrameMessageManager: nsIJSID<
        nsIContentFrameMessageManager<*, *>
      >,
      nsIInProcessContentFrameMessageManager: nsIJSID<
        nsIInProcessContentFrameMessageManager<*, *>
      >,
      nsIContentProcessMessageManager: nsIJSID<
        nsIContentProcessMessageManager<*, *>
      >,
      nsIFrameScriptLoader: nsIJSID<nsIFrameScriptLoader>,
      nsIProcessScriptLoader: nsIJSID<nsIProcessScriptLoader>,
      nsIGlobalProcessScriptLoader: nsIJSID<nsIGlobalProcessScriptLoader>,

      nsIAsyncVerifyRedirectCallback: nsIJSID<nsIAsyncVerifyRedirectCallback>,
      nsIChannel: nsIJSID<nsIChannel> & nsIChannelConstants,
      nsIChannelEventSink: nsIJSID<nsIChannelEventSink> &
        nsIChannelEventSinkConstants,
      nsIInputStreamChannel: nsIJSID<nsIInputStreamChannel>,
      nsIIOService: nsIJSID<nsIIOService>,
      nsILoadInfo: nsIJSID<nsILoadInfo> & nsILoadInfoConstants,
      nsIProtocolHandler: nsIJSID<nsIProtocolHandler> &
        nsIProtocolHandlerConstants,
      nsIRequest: nsIJSID<nsIRequest> & nsIRequestConstants,
      nsIRequestObserver: nsIJSID<nsIRequestObserver>,
      nsIStandardURL: nsIJSID<nsIStandardURL> & nsIStandardURLConstants,
      nsIStreamListener: nsIJSID<nsIStreamListener>,
      nsIURI: nsIJSID<nsIURI>,
      nsIURL: nsIJSID<nsIURL>,
      nsIFileURL: nsIJSID<nsIFileURL>,

      nsITransportSecurityInfo: nsIJSID<nsITransportSecurityInfo>,

      nsIInterfaceRequestor: nsIJSID<nsIInterfaceRequestor<*>>,
      nsISupports: nsIJSID<nsISupports<*>>,
      nsIUUIDGenerator: nsIJSID<nsIUUIDGenerator>,

      nsIComponentManager: nsIJSID<nsIComponentManager>,
      nsIComponentRegistrar: nsIJSID<nsIComponentRegistrar>,
      nsIFactory: nsIJSID<nsIFactory<*>>,

      nsISimpleEnumerator: nsIJSID<nsISimpleEnumerator<*>>,

      nsIAsyncInputStream: nsIJSID<nsIAsyncInputStream> &
        nsIAsyncInputStreamConstants,
      nsIAsyncOutputStream: nsIJSID<nsIAsyncOutputStream> &
        nsIAsyncOutputStreamConstants,
      nsIBinaryInputStream: nsIJSID<nsIBinaryInputStream>,
      nsIBinaryOutputStream: nsIJSID<nsIBinaryOutputStream>,
      nsIFile: nsIJSID<nsIFile> & nsIFileConstants,
      nsIInputStream: nsIJSID<nsIInputStream>,
      nsIOutputStream: nsIJSID<nsIOutputStream>,
      nsIPipe: nsIJSID<nsIPipe>,
      nsIScriptableInputStream: nsIJSID<nsIScriptableInputStream>,

      nsIXULRuntime: nsIJSID<nsIXULRuntime> & nsIXULRuntimeConstants,
      nsIXULAppInfo: nsIJSID<nsIXULAppInfo>,

      nsIMutable: nsIJSID<nsIMutable>,
      nsIContentSecurityManager: nsIJSID<nsIContentSecurityManager>,

      nsIArrayBufferInputStream: nsIJSID<nsIArrayBufferInputStream>,
      nsIStandardURLMutator: nsIJSID<nsIStandardURLMutator>,
      nsIURIMutator: nsIJSID<nsIURIMutator>,
      nsIWebProgressListener: nsIJSID<nsIWebProgressListener> &
        nsIWebProgressListenerConstants,
      nsISSLStatusProvider: nsIJSID<nsISSLStatusProvider>,
      nsIProgressEventSink: nsIJSID<nsIProgressEventSink>,
      nsISocketTransport: nsIJSID<nsISocketTransport> &
        nsISocketTransportConstants,
      nsIX509Cert: nsIJSID<nsIX509Cert> & nsIX509CertConstants,
      nsIFilePicker: nsIJSID<nsIFilePicker> & nsIFilePickerConstants
    },
    classes: {
      "@mozilla.org/xre/app-info;1": nsIJSCID<nsIXULAppInfo>,
      "@mozilla.org/network/simple-uri;1": nsIJSCID<nsIURI & nsIMutable>,
      "@mozilla.org/network/io-service;1": nsIJSCID<nsIIOService>,
      "@mozilla.org/network/standard-url;1": nsIJSCID<nsIStandardURL>,
      "@mozilla.org/xre/app-info;1": nsIJSCID<nsIXULRuntime>,
      "@mozilla.org/uuid-generator;1": nsIJSCID<nsIUUIDGenerator>,
      "@mozilla.org/childprocessmessagemanager;1": nsIJSCID<
        nsIContentProcessMessageManager<*, *>
      >,
      "@mozilla.org/parentprocessmessagemanager;1": nsIJSCID<
        nsIProcessScriptLoader & nsIMessageBroadcaster<*, *>
      >,
      "@mozilla.org/globalmessagemanager;1": nsIJSCID<
        nsIFrameScriptLoader &
          nsIMessageListenerManager<*> &
          nsIGlobalProcessScriptLoader
      >,
      "@mozilla.org/pipe;1": nsIJSCID<nsIPipe>,
      "@mozilla.org/network/input-stream-channel;1": nsIJSCID<
        nsIInputStreamChannel
      >,
      "@mozilla.org/scriptsecuritymanager;1": nsIJSCID<
        nsIScriptSecurityManager
      >,
      "@mozilla.org/contentsecuritymanager;1": nsIJSCID<
        nsIContentSecurityManager
      >,
      "@mozilla.org/systemprincipal;1": nsIJSCID<nsIPrincipal>,
      "@mozilla.org/nullprincipal;1": nsIJSCID<nsIPrincipal>,
      "@mozilla.org/io/arraybuffer-input-stream;1": nsIJSCID<
        nsIArrayBufferInputStream
      >,
      "@mozilla.org/network/simple-uri-mutator;1": nsIJSCID<
        nsIURLMutator | nsIURIMutator
      >,
      "@mozilla.org/network/standard-url-mutator;1": nsIJSCID<
        nsIStandardURLMutator
      >,
      "@mozilla.org/filepicker;1": nsIJSCID<nsIFilePicker>
    },
    utils: {
      waiveXrays<a>(a): a,
      cloneInto<a, b>(
        object: a,
        scope: b,
        options: ?{
          cloneFunctions?: boolean,
          wrapReflectors?: boolean
        }
      ): a,
      getGlobalForObject<a: Object>(a): Object,
      importGlobalProperties(string[]): void,
      import: (<p, p$, c, c$, m, m$>(
        "resource://gre/modules/Services.jsm",
        {}
      ) => Services<p, p$, c, c$, m, m$>) &
        JSM<"resource://gre/modules/XPCOMUtils.jsm", XPCOMUtils> &
        JSM<"resource://gre/modules/Timer.jsm", Timer> &
        JSM<"resource://gre/modules/ExtensionUtils.jsm", ExtensionUtils> &
        JSM<"resource://gre/modules/ExtensionCommon.jsm", ExtensionCommon> &
        JSM<"resource://gre/modules/osfile.jsm", OSFile> &
        JSM<
          "resource://gre/modules/ExtensionPermissions.jsm",
          { ExtensionPermissions: ExtensionPermissions }
        >
    },
    manager: Components$manager,
    ID<a>(iid: string): nsIJSID<a>,
    stack: nsIStackFrame
  }

  declare interface Components$manager
    extends nsISupports<nsIComponentRegistrar>, nsIComponentManager {}

  declare export var Cc: typeof Components.classes
  declare export var Ci: typeof Components.interfaces
  declare export var Cu: typeof Components.utils
  declare export var Cr: typeof Components.results
  declare export var Cm: typeof Components.manager
  declare export var CID: typeof Components.ID

  // JSM

  declare export interface Services<$p, p$, $c, c$, $m, m$> {
    Services: {
      ppmm: nsIMessageBroadcaster<$p, p$> & nsIGlobalProcessScriptLoader,
      cpmm: nsIContentProcessMessageManager<$c, c$>,
      mm: nsIMessageBroadcaster<$m, m$> & nsIFrameScriptLoader,
      appinfo: nsIXULAppInfo & nsIXULRuntime,
      io: nsIIOService
    };
  }

  declare export interface XPCOMUtils {
    XPCOMUtils: {
      defineLazyGetter<a>(Object, string, () => a): void,
      generateQI<a, b, c, d, e>(
        Array<nsIJSID<a> | nsIJSID<b> | nsIJSID<c> | nsIJSID<d> | nsIJSID<e>>
      ): <$: a | b | c | d | e>(nsIJSID<$>) => $
    };
  }

  declare export interface Timer {
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
    setInterval: typeof setInterval;
    clearInterval: typeof clearInterval;
  }

  declare class ExtensionData {
    rootURI: nsIURI;
    resourceURL: string;
    manifest: null;
    type: null;
    id: null;
    uuid: null;
    localeData: null;
    getURL(path: string): string;
    readDirectory(path: string): Promise<{ +name: string, +isDir: boolean }>;
    readJSON(path: string): Object;
    manifestPermissions: {
      permissions: string[],
      origins: string[]
    };
    activePermissions: {
      origins: string[],
      permissions: string[],
      apis: string[]
    };
  }

  declare class Extension extends ExtensionData {
    constructor(addonData: Object, startupReason: string): void;
    activePermissions: Object;
    callOnClose({ close(): void }): void;
    getBootstrapScope(id: string, file: string): Object;
    manifestError(message: string): void;
    manifestWarning(message: string): void;
  }

  declare class EventEmitter {}
  declare class EventManager {}

  declare type MessageChannel$Message<name, data, from: Object, to: Object> = [
    {
      messageName: name,
      channelId: number,
      sender: from & { extensionId: string, contextId: string },
      recipient: to & { extensionId: string },
      data: data,
      responseType: 0 | 1 | 2 | 3
    }
  ]

  declare export class BaseContext {
    childManager: ChildAPIManager;
    contentWindow: nsIDOMWindow;
    cloneScope: Object;
    extension: Extension;
    messageManager: nsIContentFrameMessageManager<*, *>;
    close(): void;
    getCaller(): nsIStackFrame;
    jsonStringify: typeof JSON.stringify;
    normalizeError(error: Object, nsIStackFrame): Error;
    sendMessage<name, data, from, to, out>(
      nsIMessageSender<MessageChannel$Message<name, data, from, to>>,
      messageName: name,
      data: data,
      options: {
        sender?: Object,
        recipient?: Object,
        responseType?: 0 | 1 | 2 | 3,
        lowPriority?: boolean
      }
    ): Promise<out>;
    withLastError<out>(
      { message: string },
      nsIStackFrame,
      callback: () => out
    ): out;
    wrapPromise<a>(Promise<a>): Promise<a>;
  }

  declare export class ExtensionError extends Error {}

  declare type Tuple<a = *, b = *, c = *, d = *, e = *, f = *, g = *> =
    | []
    | [a]
    | [a, b]
    | [a, b, c]
    | [a, b, c, d]
    | [a, b, c, d, e]
    | [a, b, c, d, e, f]
    | [a, b, c, d, e, f, g]

  declare interface Event {
    addListener(string, Function): void;
    removeListener(string, Function): void;
    hasListener(string): boolean;
  }

  declare class ChildAPIManager {
    messageManager: nsIMessageSender<*> & nsIMessageListenerManager<*>;
    url: nsIURI;
    id: string;
    callParentFunctionNoReturn<a, b, c, d, e, f, g>(
      string,
      Tuple<a, b, c, d, e, f, g>
    ): void;
    callParentAsyncFunction<a, b, c, d, e, f, g, out>(
      string,
      Tuple<a, b, c, d, e, f, g>
    ): Promise<out>;
    getParentEvent(string): Event;
  }

  declare export class ExtensionAPI<api> extends EventEmitter {
    constructor(Extension): void;
    destroy(): void;
    getAPI(BaseContext): api;
  }

  declare export interface ExtensionUtils {
    ExtensionUtils: {
      getConsole(): typeof console
    };
  }

  declare export interface ExtensionCommon {
    ExtensionCommon: {};
  }

  declare class OS$File$DirectoryIterator$Entry {
    +isDir: boolean;
    +isSymLink: boolean;
    +name: boolean;
    +path: boolean;

    +winLastAccessDate?: Date;
    +winCreationDate?: Date;
    +winLastWriteDate?: Date;
  }

  declare interface OSFile {
    OS: {
      Path: {
        fromFileURI(uri: nsIFileURL): string
      }
    };
  }

  declare interface Permissions {
    permissions: string[];
    origins: string[];
  }

  declare interface ExtensionPermissions {
    get(Extension): Promise<Permissions>;
    add(Extension, Permissions): Promise<void>;
    removeAll(Extension): Promise<void>;
  }
}

/* @flow */

// See: https://github.com/mozilla/gecko-dev/blob/62d7405e171e6ca7e50b578c59c96d07ee69cca0/netwerk/base/nsILoadInfo.idl

import type {nsresult, AUTF8String, long} from "../../xpcom/base/nsrootidl"
import type {nsISupports} from "../../xpcom/base/nsISupports"
import type {nsIPrincipal} from "../../caps/nsIPrincipal"

export type nsSecurityFlags = long

export interface nsILoadInfoConstants {
  SEC_NORMAL:nsSecurityFlags,
  SEC_REQUIRE_SAME_ORIGIN_DATA_INHERITS:nsSecurityFlags,
  SEC_REQUIRE_SAME_ORIGIN_DATA_IS_BLOCKED:nsSecurityFlags,
  SEC_ALLOW_CROSS_ORIGIN_DATA_INHERITS:nsSecurityFlags,
  SEC_ALLOW_CROSS_ORIGIN_DATA_IS_NULL:nsSecurityFlags,
  SEC_REQUIRE_CORS_DATA_INHERITS:nsSecurityFlags,
  SEC_COOKIES_DEFAULT:nsSecurityFlags,
  SEC_COOKIES_INCLUDE:nsSecurityFlags,
  SEC_COOKIES_SAME_ORIGIN:nsSecurityFlags,
  SEC_COOKIES_OMIT:nsSecurityFlags,
  SEC_FORCE_INHERIT_PRINCIPA:nsSecurityFlags,
  SEC_SANDBOXED:nsSecurityFlags,
  SEC_ABOUT_BLANK_INHERITS:nsSecurityFlags,
  SEC_ALLOW_CHROME:nsSecurityFlags,
  SEC_DISALLOW_SCRIPT:nsSecurityFlags,
  SEC_DONT_FOLLOW_REDIRECTS:nsSecurityFlags,
  SEC_LOAD_ERROR_PAGE:nsSecurityFlags,
  SEC_FORCE_INHERIT_PRINCIPAL_OVERRULE_OWNER:nsSecurityFlags
}

export interface nsILoadInfo extends nsISupports<nsILoadInfo> {
  loadingPrincipal:nsIPrincipal,
  triggeringPrincipal:nsIPrincipal,
  principalToInherit:nsIPrincipal,
  loadingDocument:Document,
  securityFlags:nsSecurityFlags
}

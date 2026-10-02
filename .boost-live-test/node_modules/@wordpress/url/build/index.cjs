"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/url/src/index.ts
var index_exports = {};
__export(index_exports, {
  addQueryArgs: () => import_add_query_args.addQueryArgs,
  buildQueryString: () => import_build_query_string.buildQueryString,
  cleanForSlug: () => import_clean_for_slug.cleanForSlug,
  filterURLForDisplay: () => import_filter_url_for_display.filterURLForDisplay,
  getAuthority: () => import_get_authority.getAuthority,
  getFilename: () => import_get_filename.getFilename,
  getFragment: () => import_get_fragment.getFragment,
  getPath: () => import_get_path.getPath,
  getPathAndQueryString: () => import_get_path_and_query_string.getPathAndQueryString,
  getProtocol: () => import_get_protocol.getProtocol,
  getQueryArg: () => import_get_query_arg.getQueryArg,
  getQueryArgs: () => import_get_query_args.getQueryArgs,
  getQueryString: () => import_get_query_string.getQueryString,
  hasQueryArg: () => import_has_query_arg.hasQueryArg,
  isEmail: () => import_is_email.isEmail,
  isPhoneNumber: () => import_is_phone_number.isPhoneNumber,
  isURL: () => import_is_url.isURL,
  isValidAuthority: () => import_is_valid_authority.isValidAuthority,
  isValidFragment: () => import_is_valid_fragment.isValidFragment,
  isValidPath: () => import_is_valid_path.isValidPath,
  isValidProtocol: () => import_is_valid_protocol.isValidProtocol,
  isValidQueryString: () => import_is_valid_query_string.isValidQueryString,
  normalizePath: () => import_normalize_path.normalizePath,
  prependHTTP: () => import_prepend_http.prependHTTP,
  prependHTTPS: () => import_prepend_https.prependHTTPS,
  removeQueryArgs: () => import_remove_query_args.removeQueryArgs,
  safeDecodeURI: () => import_safe_decode_uri.safeDecodeURI,
  safeDecodeURIComponent: () => import_safe_decode_uri_component.safeDecodeURIComponent
});
module.exports = __toCommonJS(index_exports);
var import_is_url = require("./is-url.cjs");
var import_is_email = require("./is-email.cjs");
var import_is_phone_number = require("./is-phone-number.cjs");
var import_get_protocol = require("./get-protocol.cjs");
var import_is_valid_protocol = require("./is-valid-protocol.cjs");
var import_get_authority = require("./get-authority.cjs");
var import_is_valid_authority = require("./is-valid-authority.cjs");
var import_get_path = require("./get-path.cjs");
var import_is_valid_path = require("./is-valid-path.cjs");
var import_get_query_string = require("./get-query-string.cjs");
var import_build_query_string = require("./build-query-string.cjs");
var import_is_valid_query_string = require("./is-valid-query-string.cjs");
var import_get_path_and_query_string = require("./get-path-and-query-string.cjs");
var import_get_fragment = require("./get-fragment.cjs");
var import_is_valid_fragment = require("./is-valid-fragment.cjs");
var import_add_query_args = require("./add-query-args.cjs");
var import_get_query_arg = require("./get-query-arg.cjs");
var import_get_query_args = require("./get-query-args.cjs");
var import_has_query_arg = require("./has-query-arg.cjs");
var import_remove_query_args = require("./remove-query-args.cjs");
var import_prepend_http = require("./prepend-http.cjs");
var import_safe_decode_uri = require("./safe-decode-uri.cjs");
var import_safe_decode_uri_component = require("./safe-decode-uri-component.cjs");
var import_filter_url_for_display = require("./filter-url-for-display.cjs");
var import_clean_for_slug = require("./clean-for-slug.cjs");
var import_get_filename = require("./get-filename.cjs");
var import_normalize_path = require("./normalize-path.cjs");
var import_prepend_https = require("./prepend-https.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addQueryArgs,
  buildQueryString,
  cleanForSlug,
  filterURLForDisplay,
  getAuthority,
  getFilename,
  getFragment,
  getPath,
  getPathAndQueryString,
  getProtocol,
  getQueryArg,
  getQueryArgs,
  getQueryString,
  hasQueryArg,
  isEmail,
  isPhoneNumber,
  isURL,
  isValidAuthority,
  isValidFragment,
  isValidPath,
  isValidProtocol,
  isValidQueryString,
  normalizePath,
  prependHTTP,
  prependHTTPS,
  removeQueryArgs,
  safeDecodeURI,
  safeDecodeURIComponent
});
//# sourceMappingURL=index.cjs.map

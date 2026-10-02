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

// packages/url/src/add-query-args.ts
var add_query_args_exports = {};
__export(add_query_args_exports, {
  addQueryArgs: () => addQueryArgs
});
module.exports = __toCommonJS(add_query_args_exports);
var import_get_query_args = require("./get-query-args.cjs");
var import_build_query_string = require("./build-query-string.cjs");
var import_get_fragment = require("./get-fragment.cjs");
function addQueryArgs(url = "", args) {
  if (!args || !Object.keys(args).length) {
    return url;
  }
  const fragment = (0, import_get_fragment.getFragment)(url) || "";
  let baseUrl = url.replace(fragment, "");
  const queryStringIndex = url.indexOf("?");
  if (queryStringIndex !== -1) {
    args = Object.assign((0, import_get_query_args.getQueryArgs)(url), args);
    baseUrl = baseUrl.substr(0, queryStringIndex);
  }
  return baseUrl + "?" + (0, import_build_query_string.buildQueryString)(args) + fragment;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addQueryArgs
});
//# sourceMappingURL=add-query-args.cjs.map

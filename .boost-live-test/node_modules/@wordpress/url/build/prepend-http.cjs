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

// packages/url/src/prepend-http.ts
var prepend_http_exports = {};
__export(prepend_http_exports, {
  prependHTTP: () => prependHTTP
});
module.exports = __toCommonJS(prepend_http_exports);
var import_is_email = require("./is-email.cjs");
var USABLE_HREF_REGEXP = /^(?:[a-z]+:|#|\?|\.|\/)/i;
function prependHTTP(url) {
  if (!url) {
    return url;
  }
  url = url.trim();
  if (!USABLE_HREF_REGEXP.test(url) && !(0, import_is_email.isEmail)(url)) {
    return "http://" + url;
  }
  return url;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  prependHTTP
});
//# sourceMappingURL=prepend-http.cjs.map

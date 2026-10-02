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

// packages/url/src/prepend-https.ts
var prepend_https_exports = {};
__export(prepend_https_exports, {
  prependHTTPS: () => prependHTTPS
});
module.exports = __toCommonJS(prepend_https_exports);
var import_prepend_http = require("./prepend-http.cjs");
function prependHTTPS(url) {
  if (!url) {
    return url;
  }
  if (url.startsWith("http://")) {
    return url;
  }
  url = (0, import_prepend_http.prependHTTP)(url);
  return url.replace(/^http:/, "https:");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  prependHTTPS
});
//# sourceMappingURL=prepend-https.cjs.map

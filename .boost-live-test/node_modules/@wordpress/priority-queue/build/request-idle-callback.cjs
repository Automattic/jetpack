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

// packages/priority-queue/src/request-idle-callback.ts
var request_idle_callback_exports = {};
__export(request_idle_callback_exports, {
  createRequestIdleCallback: () => createRequestIdleCallback,
  default: () => request_idle_callback_default
});
module.exports = __toCommonJS(request_idle_callback_exports);
var import_requestidlecallback = require("requestidlecallback");
function createRequestIdleCallback() {
  if (typeof window === "undefined") {
    return (callback) => {
      setTimeout(() => callback(Date.now()), 0);
    };
  }
  return window.requestIdleCallback;
}
var request_idle_callback_default = createRequestIdleCallback();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createRequestIdleCallback
});
//# sourceMappingURL=request-idle-callback.cjs.map

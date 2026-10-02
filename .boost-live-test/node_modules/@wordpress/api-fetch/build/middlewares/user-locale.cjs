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

// packages/api-fetch/src/middlewares/user-locale.ts
var user_locale_exports = {};
__export(user_locale_exports, {
  default: () => user_locale_default
});
module.exports = __toCommonJS(user_locale_exports);
var import_url = require("@wordpress/url");
var userLocaleMiddleware = (options, next) => {
  if (typeof options.url === "string" && !(0, import_url.hasQueryArg)(options.url, "_locale")) {
    options.url = (0, import_url.addQueryArgs)(options.url, { _locale: "user" });
  }
  if (typeof options.path === "string" && !(0, import_url.hasQueryArg)(options.path, "_locale")) {
    options.path = (0, import_url.addQueryArgs)(options.path, { _locale: "user" });
  }
  return next(options);
};
var user_locale_default = userLocaleMiddleware;
//# sourceMappingURL=user-locale.cjs.map

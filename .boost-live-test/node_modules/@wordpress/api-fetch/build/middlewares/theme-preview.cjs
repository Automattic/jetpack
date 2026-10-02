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

// packages/api-fetch/src/middlewares/theme-preview.ts
var theme_preview_exports = {};
__export(theme_preview_exports, {
  default: () => theme_preview_default
});
module.exports = __toCommonJS(theme_preview_exports);
var import_url = require("@wordpress/url");
var createThemePreviewMiddleware = (themePath) => (options, next) => {
  if (typeof options.url === "string") {
    const wpThemePreview = (0, import_url.getQueryArg)(
      options.url,
      "wp_theme_preview"
    );
    if (wpThemePreview === void 0) {
      options.url = (0, import_url.addQueryArgs)(options.url, {
        wp_theme_preview: themePath
      });
    } else if (wpThemePreview === "") {
      options.url = (0, import_url.removeQueryArgs)(
        options.url,
        "wp_theme_preview"
      );
    }
  }
  if (typeof options.path === "string") {
    const wpThemePreview = (0, import_url.getQueryArg)(
      options.path,
      "wp_theme_preview"
    );
    if (wpThemePreview === void 0) {
      options.path = (0, import_url.addQueryArgs)(options.path, {
        wp_theme_preview: themePath
      });
    } else if (wpThemePreview === "") {
      options.path = (0, import_url.removeQueryArgs)(
        options.path,
        "wp_theme_preview"
      );
    }
  }
  return next(options);
};
var theme_preview_default = createThemePreviewMiddleware;
//# sourceMappingURL=theme-preview.cjs.map

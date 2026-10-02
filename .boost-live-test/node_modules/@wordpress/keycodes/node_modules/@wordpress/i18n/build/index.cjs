"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/i18n/src/index.ts
var index_exports = {};
__export(index_exports, {
  __: () => import_default_i18n.__,
  _n: () => import_default_i18n._n,
  _nx: () => import_default_i18n._nx,
  _x: () => import_default_i18n._x,
  defaultI18n: () => import_default_i18n.default,
  getLocaleData: () => import_default_i18n.getLocaleData,
  hasTranslation: () => import_default_i18n.hasTranslation,
  isRTL: () => import_default_i18n.isRTL,
  resetLocaleData: () => import_default_i18n.resetLocaleData,
  setLocaleData: () => import_default_i18n.setLocaleData,
  sprintf: () => import_sprintf.sprintf,
  subscribe: () => import_default_i18n.subscribe
});
module.exports = __toCommonJS(index_exports);
var import_sprintf = require("./sprintf.cjs");
__reExport(index_exports, require("./create-i18n.cjs"), module.exports);
var import_default_i18n = __toESM(require("./default-i18n.cjs"));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  __,
  _n,
  _nx,
  _x,
  defaultI18n,
  getLocaleData,
  hasTranslation,
  isRTL,
  resetLocaleData,
  setLocaleData,
  sprintf,
  subscribe,
  ...require("./create-i18n.cjs")
});
//# sourceMappingURL=index.cjs.map

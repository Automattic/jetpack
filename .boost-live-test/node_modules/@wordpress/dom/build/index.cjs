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

// packages/dom/src/index.js
var index_exports = {};
__export(index_exports, {
  focus: () => focus
});
module.exports = __toCommonJS(index_exports);
var focusable = __toESM(require("./focusable.cjs"));
var tabbable = __toESM(require("./tabbable.cjs"));
__reExport(index_exports, require("./dom/index.cjs"), module.exports);
__reExport(index_exports, require("./phrasing-content.cjs"), module.exports);
__reExport(index_exports, require("./data-transfer.cjs"), module.exports);
var focus = { focusable, tabbable };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  focus,
  ...require("./dom/index.cjs"),
  ...require("./phrasing-content.cjs"),
  ...require("./data-transfer.cjs")
});
//# sourceMappingURL=index.cjs.map

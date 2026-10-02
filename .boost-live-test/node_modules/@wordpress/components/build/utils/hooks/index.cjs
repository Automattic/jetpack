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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/utils/hooks/index.js
var hooks_exports = {};
__export(hooks_exports, {
  useControlledState: () => import_use_controlled_state.default,
  useControlledValue: () => import_use_controlled_value.useControlledValue,
  useCx: () => import_use_cx.useCx,
  useUpdateEffect: () => import_use_update_effect.default
});
module.exports = __toCommonJS(hooks_exports);
var import_use_controlled_state = __toESM(require("./use-controlled-state.cjs"));
var import_use_update_effect = __toESM(require("./use-update-effect.cjs"));
var import_use_controlled_value = require("./use-controlled-value.cjs");
var import_use_cx = require("./use-cx.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useControlledState,
  useControlledValue,
  useCx,
  useUpdateEffect
});
//# sourceMappingURL=index.cjs.map

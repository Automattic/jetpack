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

// packages/components/src/slot-fill/context.ts
var context_exports = {};
__export(context_exports, {
  default: () => context_default
});
module.exports = __toCommonJS(context_exports);
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import_warning = __toESM(require("@wordpress/warning"));
var initialValue = {
  slots: (0, import_compose.observableMap)(),
  fills: (0, import_compose.observableMap)(),
  registerSlot: () => {
    globalThis.SCRIPT_DEBUG === true ? (0, import_warning.default)("Components must be wrapped within `SlotFillProvider`. See https://developer.wordpress.org/block-editor/components/slot-fill/") : void 0;
  },
  unregisterSlot: () => {
  },
  updateSlot: () => {
  },
  registerFill: () => {
  },
  unregisterFill: () => {
  },
  updateFill: () => {
  },
  // This helps the provider know if it's using the default context value or not.
  isDefault: true
};
var SlotFillContext = (0, import_element.createContext)(initialValue);
SlotFillContext.displayName = "SlotFillContext";
var context_default = SlotFillContext;
//# sourceMappingURL=context.cjs.map

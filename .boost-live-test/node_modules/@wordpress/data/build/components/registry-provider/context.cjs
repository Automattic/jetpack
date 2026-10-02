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

// packages/data/src/components/registry-provider/context.ts
var context_exports = {};
__export(context_exports, {
  Context: () => Context,
  RegistryConsumer: () => RegistryConsumer,
  default: () => context_default
});
module.exports = __toCommonJS(context_exports);
var import_element = require("@wordpress/element");
var import_default_registry = __toESM(require("../../default-registry.cjs"));
var Context = (0, import_element.createContext)(import_default_registry.default);
Context.displayName = "RegistryProviderContext";
var { Consumer, Provider } = Context;
var RegistryConsumer = Consumer;
var context_default = Provider;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Context,
  RegistryConsumer
});
//# sourceMappingURL=context.cjs.map

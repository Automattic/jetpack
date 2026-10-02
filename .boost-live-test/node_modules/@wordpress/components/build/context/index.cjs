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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/context/index.ts
var context_exports = {};
__export(context_exports, {
  ContextSystemProvider: () => import_context_system_provider.ContextSystemProvider,
  contextConnect: () => import_context_connect.contextConnect,
  contextConnectWithoutRef: () => import_context_connect.contextConnectWithoutRef,
  getConnectNamespace: () => import_context_connect.getConnectNamespace,
  hasConnectNamespace: () => import_context_connect.hasConnectNamespace,
  useComponentsContext: () => import_context_system_provider.useComponentsContext,
  useContextSystem: () => import_use_context_system.useContextSystem
});
module.exports = __toCommonJS(context_exports);
var import_context_system_provider = require("./context-system-provider.cjs");
var import_context_connect = require("./context-connect.cjs");
var import_use_context_system = require("./use-context-system.cjs");
__reExport(context_exports, require("./wordpress-component.cjs"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ContextSystemProvider,
  contextConnect,
  contextConnectWithoutRef,
  getConnectNamespace,
  hasConnectNamespace,
  useComponentsContext,
  useContextSystem,
  ...require("./wordpress-component.cjs")
});
//# sourceMappingURL=index.cjs.map

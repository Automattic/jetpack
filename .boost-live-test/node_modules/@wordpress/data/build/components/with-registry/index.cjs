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

// packages/data/src/components/with-registry/index.tsx
var with_registry_exports = {};
__export(with_registry_exports, {
  default: () => with_registry_default
});
module.exports = __toCommonJS(with_registry_exports);
var import_compose = require("@wordpress/compose");
var import_registry_provider = require("../registry-provider/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var withRegistry = (0, import_compose.createHigherOrderComponent)(
  (OriginalComponent) => (props) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_registry_provider.RegistryConsumer, { children: (registry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OriginalComponent, { ...props, registry }) }),
  "withRegistry"
);
var with_registry_default = withRegistry;
//# sourceMappingURL=index.cjs.map

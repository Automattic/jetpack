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

// packages/components/src/flex/flex-item/component.tsx
var component_exports = {};
__export(component_exports, {
  FlexItem: () => FlexItem,
  default: () => component_default
});
module.exports = __toCommonJS(component_exports);
var import_context = require("../../context/index.cjs");
var import_view = require("../../view/index.cjs");
var import_hook = require("./hook.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function UnconnectedFlexItem(props, forwardedRef) {
  const flexItemProps = (0, import_hook.useFlexItem)(props);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_view.View, {
    ...flexItemProps,
    ref: forwardedRef
  });
}
var FlexItem = (0, import_context.contextConnect)(UnconnectedFlexItem, "FlexItem");
var component_default = FlexItem;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FlexItem
});
//# sourceMappingURL=component.cjs.map

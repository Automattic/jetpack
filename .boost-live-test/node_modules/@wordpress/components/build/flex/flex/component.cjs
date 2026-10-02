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

// packages/components/src/flex/flex/component.tsx
var component_exports = {};
__export(component_exports, {
  Flex: () => Flex,
  default: () => component_default
});
module.exports = __toCommonJS(component_exports);
var import_context = require("../../context/index.cjs");
var import_hook = require("./hook.cjs");
var import_context2 = require("../context.cjs");
var import_view = require("../../view/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function UnconnectedFlex(props, forwardedRef) {
  const {
    children,
    isColumn,
    ...otherProps
  } = (0, import_hook.useFlex)(props);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_context2.FlexContext.Provider, {
    value: {
      flexItemDisplay: isColumn ? "block" : void 0
    },
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_view.View, {
      ...otherProps,
      ref: forwardedRef,
      children
    })
  });
}
var Flex = (0, import_context.contextConnect)(UnconnectedFlex, "Flex");
var component_default = Flex;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Flex
});
//# sourceMappingURL=component.cjs.map

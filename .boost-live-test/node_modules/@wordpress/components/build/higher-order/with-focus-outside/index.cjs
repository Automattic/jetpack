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

// packages/components/src/higher-order/with-focus-outside/index.tsx
var with_focus_outside_exports = {};
__export(with_focus_outside_exports, {
  default: () => with_focus_outside_default
});
module.exports = __toCommonJS(with_focus_outside_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_jsx_runtime = require("react/jsx-runtime");
var with_focus_outside_default = (0, import_compose.createHigherOrderComponent)((WrappedComponent) => function WithFocusOutside(props) {
  const [handleFocusOutside, setHandleFocusOutside] = (0, import_element.useState)(void 0);
  const bindFocusOutsideHandler = (0, import_element.useCallback)((node) => setHandleFocusOutside(() => node?.handleFocusOutside ? node.handleFocusOutside.bind(node) : void 0), []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
    ...(0, import_compose.__experimentalUseFocusOutside)(handleFocusOutside),
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WrappedComponent, {
      ref: bindFocusOutsideHandler,
      ...props
    })
  });
}, "withFocusOutside");
//# sourceMappingURL=index.cjs.map

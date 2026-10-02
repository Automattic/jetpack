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

// packages/components/src/higher-order/with-constrained-tabbing/index.tsx
var with_constrained_tabbing_exports = {};
__export(with_constrained_tabbing_exports, {
  default: () => with_constrained_tabbing_default
});
module.exports = __toCommonJS(with_constrained_tabbing_exports);
var import_compose = require("@wordpress/compose");
var import_jsx_runtime = require("react/jsx-runtime");
var withConstrainedTabbing = (0, import_compose.createHigherOrderComponent)((WrappedComponent) => function ComponentWithConstrainedTabbing(props) {
  const ref = (0, import_compose.useConstrainedTabbing)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
    ref,
    tabIndex: -1,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WrappedComponent, {
      ...props
    })
  });
}, "withConstrainedTabbing");
var with_constrained_tabbing_default = withConstrainedTabbing;
//# sourceMappingURL=index.cjs.map

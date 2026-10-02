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

// packages/data/src/components/with-dispatch/index.tsx
var with_dispatch_exports = {};
__export(with_dispatch_exports, {
  default: () => with_dispatch_default
});
module.exports = __toCommonJS(with_dispatch_exports);
var import_compose = require("@wordpress/compose");
var import_use_dispatch = require("../use-dispatch/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var withDispatch = (mapDispatchToProps) => (0, import_compose.createHigherOrderComponent)(
  (WrappedComponent) => (ownProps) => {
    const mapDispatch = (dispatch, registry) => mapDispatchToProps(dispatch, ownProps, registry);
    const dispatchProps = (0, import_use_dispatch.useDispatchWithMap)(mapDispatch, []);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WrappedComponent, { ...ownProps, ...dispatchProps });
  },
  "withDispatch"
);
var with_dispatch_default = withDispatch;
//# sourceMappingURL=index.cjs.map

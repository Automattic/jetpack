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

// packages/compose/src/higher-order/if-condition/index.tsx
var if_condition_exports = {};
__export(if_condition_exports, {
  default: () => if_condition_default
});
module.exports = __toCommonJS(if_condition_exports);
var import_create_higher_order_component = require("../../utils/create-higher-order-component/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function ifCondition(predicate) {
  return (0, import_create_higher_order_component.createHigherOrderComponent)(
    (WrappedComponent) => (props) => {
      if (!predicate(props)) {
        return null;
      }
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WrappedComponent, { ...props });
    },
    "ifCondition"
  );
}
var if_condition_default = ifCondition;
//# sourceMappingURL=index.cjs.map

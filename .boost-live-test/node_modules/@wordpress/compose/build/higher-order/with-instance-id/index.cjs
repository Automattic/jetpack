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

// packages/compose/src/higher-order/with-instance-id/index.tsx
var with_instance_id_exports = {};
__export(with_instance_id_exports, {
  default: () => with_instance_id_default
});
module.exports = __toCommonJS(with_instance_id_exports);
var import_create_higher_order_component = require("../../utils/create-higher-order-component/index.cjs");
var import_use_instance_id = __toESM(require("../../hooks/use-instance-id/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var withInstanceId = (0, import_create_higher_order_component.createHigherOrderComponent)(
  (WrappedComponent) => {
    return (props) => {
      const instanceId = (0, import_use_instance_id.default)(WrappedComponent);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WrappedComponent, { ...props, instanceId });
    };
  },
  "instanceId"
);
var with_instance_id_default = withInstanceId;
//# sourceMappingURL=index.cjs.map

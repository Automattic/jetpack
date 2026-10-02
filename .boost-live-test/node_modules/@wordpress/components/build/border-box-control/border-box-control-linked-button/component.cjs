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

// packages/components/src/border-box-control/border-box-control-linked-button/component.tsx
var component_exports = {};
__export(component_exports, {
  default: () => component_default
});
module.exports = __toCommonJS(component_exports);
var import_icons = require("@wordpress/icons");
var import_i18n = require("@wordpress/i18n");
var import_button = __toESM(require("../../button/index.cjs"));
var import_context = require("../../context/index.cjs");
var import_hook = require("./hook.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var BorderBoxControlLinkedButton = (props, forwardedRef) => {
  const {
    className,
    isLinked,
    ...buttonProps
  } = (0, import_hook.useBorderBoxControlLinkedButton)(props);
  const label = isLinked ? (0, import_i18n.__)("Unlink sides") : (0, import_i18n.__)("Link sides");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
    ...buttonProps,
    size: "small",
    icon: isLinked ? import_icons.link : import_icons.linkOff,
    iconSize: 24,
    label,
    ref: forwardedRef,
    className
  });
};
var ConnectedBorderBoxControlLinkedButton = (0, import_context.contextConnect)(BorderBoxControlLinkedButton, "BorderBoxControlLinkedButton");
var component_default = ConnectedBorderBoxControlLinkedButton;
//# sourceMappingURL=component.cjs.map

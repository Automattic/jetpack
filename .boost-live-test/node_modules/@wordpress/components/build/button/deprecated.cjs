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

// packages/components/src/button/deprecated.tsx
var deprecated_exports = {};
__export(deprecated_exports, {
  default: () => deprecated_default
});
module.exports = __toCommonJS(deprecated_exports);
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_element = require("@wordpress/element");
var import__ = __toESM(require("./index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedIconButton({
  label,
  labelPosition,
  size,
  tooltip,
  ...props
}, ref) {
  (0, import_deprecated.default)("wp.components.IconButton", {
    since: "5.4",
    alternative: "wp.components.Button",
    version: "6.2"
  });
  return (
    // Disable reason: the parent component is taking care of the __next40pxDefaultSize prop.
    // eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import__.default, {
      ...props,
      ref,
      tooltipPosition: labelPosition,
      iconSize: size,
      showTooltip: tooltip !== void 0 ? !!tooltip : void 0,
      label: tooltip || label
    })
  );
}
var deprecated_default = (0, import_element.forwardRef)(UnforwardedIconButton);
//# sourceMappingURL=deprecated.cjs.map

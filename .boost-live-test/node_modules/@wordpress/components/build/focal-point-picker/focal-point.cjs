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

// packages/components/src/focal-point-picker/focal-point.tsx
var focal_point_exports = {};
__export(focal_point_exports, {
  default: () => FocalPoint
});
module.exports = __toCommonJS(focal_point_exports);
var import_focal_point_style = require("./styles/focal-point-style.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function FocalPoint({
  left = "50%",
  top = "50%",
  ...props
}) {
  const style = {
    left,
    top
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_focal_point_style.PointerCircle, {
    ...props,
    className: "components-focal-point-picker__icon_container",
    style
  });
}
//# sourceMappingURL=focal-point.cjs.map

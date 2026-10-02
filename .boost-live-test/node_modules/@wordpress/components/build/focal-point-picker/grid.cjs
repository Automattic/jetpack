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

// packages/components/src/focal-point-picker/grid.tsx
var grid_exports = {};
__export(grid_exports, {
  default: () => FocalPointPickerGrid
});
module.exports = __toCommonJS(grid_exports);
var import_focal_point_picker_style = require("./styles/focal-point-picker-style.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function FocalPointPickerGrid({
  bounds,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_focal_point_picker_style.GridView, {
    ...props,
    className: "components-focal-point-picker__grid",
    style: {
      width: bounds.width,
      height: bounds.height
    },
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_focal_point_picker_style.GridLineX, {
      style: {
        top: "33%"
      }
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_focal_point_picker_style.GridLineX, {
      style: {
        top: "66%"
      }
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_focal_point_picker_style.GridLineY, {
      style: {
        left: "33%"
      }
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_focal_point_picker_style.GridLineY, {
      style: {
        left: "66%"
      }
    })]
  });
}
//# sourceMappingURL=grid.cjs.map

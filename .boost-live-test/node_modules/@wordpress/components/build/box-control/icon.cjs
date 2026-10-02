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

// packages/components/src/box-control/icon.tsx
var icon_exports = {};
__export(icon_exports, {
  default: () => BoxControlIcon
});
module.exports = __toCommonJS(icon_exports);
var import_box_control_icon_styles = require("./styles/box-control-icon-styles.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var BASE_ICON_SIZE = 24;
function BoxControlIcon({
  size = 24,
  side = "all",
  sides,
  ...props
}) {
  const isSideDisabled = (value) => sides?.length && !sides.includes(value);
  const hasSide = (value) => {
    if (isSideDisabled(value)) {
      return false;
    }
    return side === "all" || side === value;
  };
  const top = hasSide("top") || hasSide("vertical");
  const right = hasSide("right") || hasSide("horizontal");
  const bottom = hasSide("bottom") || hasSide("vertical");
  const left = hasSide("left") || hasSide("horizontal");
  const scale = size / BASE_ICON_SIZE;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_box_control_icon_styles.Root, {
    style: {
      transform: `scale(${scale})`
    },
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_box_control_icon_styles.Viewbox, {
      children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_box_control_icon_styles.TopStroke, {
        isFocused: top
      }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_box_control_icon_styles.RightStroke, {
        isFocused: right
      }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_box_control_icon_styles.BottomStroke, {
        isFocused: bottom
      }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_box_control_icon_styles.LeftStroke, {
        isFocused: left
      })]
    })
  });
}
//# sourceMappingURL=icon.cjs.map

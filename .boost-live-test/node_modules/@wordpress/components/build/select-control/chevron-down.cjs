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

// packages/components/src/select-control/chevron-down.tsx
var chevron_down_exports = {};
__export(chevron_down_exports, {
  default: () => chevron_down_default
});
module.exports = __toCommonJS(chevron_down_exports);
var import_icons = require("@wordpress/icons");
var import_select_control_styles = require("./styles/select-control-styles.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var SelectControlChevronDown = () => {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_select_control_styles.InputControlSuffixWrapperWithClickThrough, {
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_select_control_styles.DownArrowWrapper, {
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icons.Icon, {
        icon: import_icons.chevronDown,
        size: import_select_control_styles.chevronIconSize
      })
    })
  });
};
var chevron_down_default = SelectControlChevronDown;
//# sourceMappingURL=chevron-down.cjs.map

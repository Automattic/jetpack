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

// packages/components/src/toggle-control/index.tsx
var toggle_control_exports = {};
__export(toggle_control_exports, {
  ToggleControl: () => ToggleControl,
  default: () => toggle_control_default
});
module.exports = __toCommonJS(toggle_control_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_flex = require("../flex/index.cjs");
var import_form_toggle = __toESM(require("../form-toggle/index.cjs"));
var import_base_control = __toESM(require("../base-control/index.cjs"));
var import_h_stack = require("../h-stack/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedToggleControl({
  label,
  checked,
  help,
  className,
  onChange,
  disabled,
  // Prevent passing to internal component.
  __nextHasNoMarginBottom: _,
  ...additionalProps
}, ref) {
  function onChangeToggle(event) {
    onChange(event.target.checked);
  }
  const instanceId = (0, import_compose.useInstanceId)(ToggleControl);
  const id = `inspector-toggle-control-${instanceId}`;
  let describedBy, helpLabel;
  if (help) {
    if (typeof help === "function") {
      if (checked !== void 0) {
        helpLabel = help(checked);
      }
    } else {
      helpLabel = help;
    }
    if (helpLabel) {
      describedBy = id + "__help";
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_base_control.default, {
    id,
    help: helpLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
      className: "components-toggle-control__help",
      children: helpLabel
    }),
    className: (0, import_clsx.default)("components-toggle-control", className),
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_h_stack.HStack, {
      justify: "flex-start",
      spacing: 2,
      children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_form_toggle.default, {
        id,
        checked,
        onChange: onChangeToggle,
        "aria-describedby": describedBy,
        disabled,
        ref,
        ...additionalProps
      }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_flex.FlexBlock, {
        as: "label",
        htmlFor: id,
        className: (0, import_clsx.default)("components-toggle-control__label", {
          "is-disabled": disabled
        }),
        children: label
      })]
    })
  });
}
var ToggleControl = (0, import_element.forwardRef)(UnforwardedToggleControl);
ToggleControl.displayName = "ToggleControl";
var toggle_control_default = ToggleControl;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToggleControl
});
//# sourceMappingURL=index.cjs.map

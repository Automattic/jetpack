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

// packages/components/src/circular-option-picker/circular-option-picker-actions.tsx
var circular_option_picker_actions_exports = {};
__export(circular_option_picker_actions_exports, {
  ButtonAction: () => ButtonAction,
  DropdownLinkAction: () => DropdownLinkAction
});
module.exports = __toCommonJS(circular_option_picker_actions_exports);
var import_clsx = __toESM(require("clsx"));
var import_button = __toESM(require("../button/index.cjs"));
var import_dropdown = __toESM(require("../dropdown/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function DropdownLinkAction({
  buttonProps,
  className,
  dropdownProps,
  linkText
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dropdown.default, {
    className: (0, import_clsx.default)("components-circular-option-picker__dropdown-link-action", className),
    renderToggle: ({
      isOpen,
      onToggle
    }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
      "aria-expanded": isOpen,
      "aria-haspopup": "true",
      onClick: onToggle,
      variant: "link",
      ...buttonProps,
      children: linkText
    }),
    ...dropdownProps
  });
}
function ButtonAction({
  className,
  children,
  ...additionalProps
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
    __next40pxDefaultSize: true,
    className: (0, import_clsx.default)("components-circular-option-picker__clear", className),
    variant: "tertiary",
    ...additionalProps,
    children
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ButtonAction,
  DropdownLinkAction
});
//# sourceMappingURL=circular-option-picker-actions.cjs.map

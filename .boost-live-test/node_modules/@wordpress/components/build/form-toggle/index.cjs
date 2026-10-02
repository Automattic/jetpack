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

// packages/components/src/form-toggle/index.tsx
var form_toggle_exports = {};
__export(form_toggle_exports, {
  FormToggle: () => FormToggle,
  default: () => form_toggle_default,
  noop: () => noop
});
module.exports = __toCommonJS(form_toggle_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_jsx_runtime = require("react/jsx-runtime");
var noop = () => {
};
function UnforwardedFormToggle(props, ref) {
  const {
    className,
    checked,
    id,
    disabled,
    onChange = noop,
    onClick,
    ...additionalProps
  } = props;
  const wrapperClasses = (0, import_clsx.default)("components-form-toggle", className, {
    "is-checked": checked,
    "is-disabled": disabled
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
    className: wrapperClasses,
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
      className: "components-form-toggle__input",
      id,
      type: "checkbox",
      checked,
      onChange,
      disabled,
      onClick: (event) => {
        event.currentTarget.focus();
        onClick?.(event);
      },
      ...additionalProps,
      ref
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
      className: "components-form-toggle__track"
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
      className: "components-form-toggle__thumb"
    })]
  });
}
var FormToggle = (0, import_element.forwardRef)(UnforwardedFormToggle);
FormToggle.displayName = "FormToggle";
var form_toggle_default = FormToggle;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FormToggle,
  noop
});
//# sourceMappingURL=index.cjs.map

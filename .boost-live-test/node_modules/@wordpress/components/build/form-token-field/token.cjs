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

// packages/components/src/form-token-field/token.tsx
var token_exports = {};
__export(token_exports, {
  default: () => Token
});
module.exports = __toCommonJS(token_exports);
var import_clsx = __toESM(require("clsx"));
var import_compose = require("@wordpress/compose");
var import_i18n = require("@wordpress/i18n");
var import_icons = require("@wordpress/icons");
var import_button = __toESM(require("../button/index.cjs"));
var import_visually_hidden = require("../visually-hidden/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var noop = () => {
};
function Token({
  value,
  status,
  title,
  displayTransform,
  isBorderless = false,
  disabled = false,
  onClickRemove = noop,
  onMouseEnter,
  onMouseLeave,
  messages,
  termPosition,
  termsCount
}) {
  const instanceId = (0, import_compose.useInstanceId)(Token);
  const tokenClasses = (0, import_clsx.default)("components-form-token-field__token", {
    "is-error": "error" === status,
    "is-success": "success" === status,
    "is-validating": "validating" === status,
    "is-borderless": isBorderless,
    "is-disabled": disabled
  });
  const onClick = () => onClickRemove({
    value
  });
  const transformedValue = displayTransform(value);
  const termPositionAndCount = (0, import_i18n.sprintf)(
    /* translators: 1: term name, 2: term position in a set of terms, 3: total term set count. */
    (0, import_i18n.__)("%1$s (%2$d of %3$d)"),
    transformedValue,
    termPosition,
    termsCount
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
    className: tokenClasses,
    onMouseEnter,
    onMouseLeave,
    title,
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
      className: "components-form-token-field__token-text",
      id: `components-form-token-field__token-text-${instanceId}`,
      children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_visually_hidden.VisuallyHidden, {
        as: "span",
        children: termPositionAndCount
      }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
        "aria-hidden": "true",
        children: transformedValue
      })]
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
      className: "components-form-token-field__remove-token",
      size: "small",
      icon: import_icons.closeSmall,
      onClick: !disabled ? onClick : void 0,
      disabled,
      label: messages.remove,
      "aria-describedby": `components-form-token-field__token-text-${instanceId}`
    })]
  });
}
//# sourceMappingURL=token.cjs.map

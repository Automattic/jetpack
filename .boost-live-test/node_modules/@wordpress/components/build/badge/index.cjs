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

// packages/components/src/badge/index.tsx
var badge_exports = {};
__export(badge_exports, {
  default: () => badge_default
});
module.exports = __toCommonJS(badge_exports);
var import_clsx = __toESM(require("clsx"));
var import_icons = require("@wordpress/icons");
var import_icon = __toESM(require("../icon/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function contextBasedIcon(intent = "default") {
  switch (intent) {
    case "info":
      return import_icons.info;
    case "success":
      return import_icons.published;
    case "warning":
      return import_icons.caution;
    case "error":
      return import_icons.error;
    default:
      return null;
  }
}
function Badge({
  className,
  intent = "default",
  children,
  ...props
}) {
  const icon = contextBasedIcon(intent);
  const hasIcon = !!icon;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
    className: (0, import_clsx.default)("components-badge", className, {
      [`is-${intent}`]: intent,
      "has-icon": hasIcon
    }),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
      className: "components-badge__flex-wrapper",
      children: [hasIcon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icon.default, {
        icon,
        size: 16,
        fill: "currentColor",
        className: "components-badge__icon"
      }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
        className: "components-badge__content",
        children
      })]
    })
  });
}
var badge_default = Badge;
//# sourceMappingURL=index.cjs.map

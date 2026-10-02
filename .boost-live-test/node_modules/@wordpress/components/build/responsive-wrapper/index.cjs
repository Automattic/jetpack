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

// packages/components/src/responsive-wrapper/index.tsx
var responsive_wrapper_exports = {};
__export(responsive_wrapper_exports, {
  default: () => responsive_wrapper_default
});
module.exports = __toCommonJS(responsive_wrapper_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_jsx_runtime = require("react/jsx-runtime");
function ResponsiveWrapper({
  naturalWidth,
  naturalHeight,
  children,
  isInline = false
}) {
  if (import_element.Children.count(children) !== 1) {
    return null;
  }
  const TagName = isInline ? "span" : "div";
  let aspectRatio;
  if (naturalWidth && naturalHeight) {
    aspectRatio = `${naturalWidth} / ${naturalHeight}`;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagName, {
    className: "components-responsive-wrapper",
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      children: (0, import_element.cloneElement)(children, {
        className: (0, import_clsx.default)("components-responsive-wrapper__content", children.props.className),
        style: {
          ...children.props.style,
          aspectRatio
        }
      })
    })
  });
}
var responsive_wrapper_default = ResponsiveWrapper;
//# sourceMappingURL=index.cjs.map

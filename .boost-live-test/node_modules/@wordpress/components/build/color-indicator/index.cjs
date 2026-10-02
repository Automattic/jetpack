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

// packages/components/src/color-indicator/index.tsx
var color_indicator_exports = {};
__export(color_indicator_exports, {
  ColorIndicator: () => ColorIndicator,
  default: () => color_indicator_default
});
module.exports = __toCommonJS(color_indicator_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedColorIndicator(props, forwardedRef) {
  const {
    className,
    colorValue,
    ...additionalProps
  } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
    className: (0, import_clsx.default)("component-color-indicator", className),
    style: {
      background: colorValue
    },
    ref: forwardedRef,
    ...additionalProps
  });
}
var ColorIndicator = (0, import_element.forwardRef)(UnforwardedColorIndicator);
ColorIndicator.displayName = "ColorIndicator";
var color_indicator_default = ColorIndicator;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ColorIndicator
});
//# sourceMappingURL=index.cjs.map

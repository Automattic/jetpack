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

// packages/components/src/duotone-picker/duotone-swatch.tsx
var duotone_swatch_exports = {};
__export(duotone_swatch_exports, {
  default: () => duotone_swatch_default
});
module.exports = __toCommonJS(duotone_swatch_exports);
var import_icons = require("@wordpress/icons");
var import_color_indicator = __toESM(require("../color-indicator/index.cjs"));
var import_icon = __toESM(require("../icon/index.cjs"));
var import_utils = require("./utils.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function DuotoneSwatch({
  values
}) {
  return values ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_color_indicator.default, {
    colorValue: (0, import_utils.getGradientFromCSSColors)(values, "135deg")
  }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icon.default, {
    icon: import_icons.swatch
  });
}
var duotone_swatch_default = DuotoneSwatch;
//# sourceMappingURL=duotone-swatch.cjs.map

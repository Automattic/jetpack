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

// packages/components/src/utils/colors.js
var colors_exports = {};
__export(colors_exports, {
  getOptimalTextColor: () => getOptimalTextColor,
  getOptimalTextShade: () => getOptimalTextShade,
  rgba: () => rgba
});
module.exports = __toCommonJS(colors_exports);
var import_memize = __toESM(require("memize"));
var import_colord = require("colord");
var import_names = __toESM(require("colord/plugins/names"));
var colorComputationNode;
(0, import_colord.extend)([import_names.default]);
function rgba(hexValue = "", alpha = 1) {
  return (0, import_colord.colord)(hexValue).alpha(alpha).toRgbString();
}
function getColorComputationNode() {
  if (typeof document === "undefined") {
    return;
  }
  if (!colorComputationNode) {
    const el = document.createElement("div");
    el.setAttribute("data-g2-color-computation-node", "");
    document.body.appendChild(el);
    colorComputationNode = el;
  }
  return colorComputationNode;
}
function isColor(value) {
  if (typeof value !== "string") {
    return false;
  }
  const test = (0, import_colord.colord)(value);
  return test.isValid();
}
function _getComputedBackgroundColor(backgroundColor) {
  if (typeof backgroundColor !== "string") {
    return "";
  }
  if (isColor(backgroundColor)) {
    return backgroundColor;
  }
  if (!backgroundColor.includes("var(")) {
    return "";
  }
  if (typeof document === "undefined") {
    return "";
  }
  const el = getColorComputationNode();
  if (!el) {
    return "";
  }
  el.style.background = backgroundColor;
  const computedColor = window?.getComputedStyle(el).background;
  el.style.background = "";
  return computedColor || "";
}
var getComputedBackgroundColor = (0, import_memize.default)(_getComputedBackgroundColor);
function getOptimalTextColor(backgroundColor) {
  const background = getComputedBackgroundColor(backgroundColor);
  return (0, import_colord.colord)(background).isLight() ? "#000000" : "#ffffff";
}
function getOptimalTextShade(backgroundColor) {
  const result = getOptimalTextColor(backgroundColor);
  return result === "#000000" ? "dark" : "light";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getOptimalTextColor,
  getOptimalTextShade,
  rgba
});
//# sourceMappingURL=colors.cjs.map

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

// packages/components/src/duotone-picker/utils.ts
var utils_exports = {};
__export(utils_exports, {
  getColorStopsFromColors: () => getColorStopsFromColors,
  getColorsFromColorStops: () => getColorsFromColorStops,
  getDefaultColors: () => getDefaultColors,
  getGradientFromCSSColors: () => getGradientFromCSSColors
});
module.exports = __toCommonJS(utils_exports);
var import_colord = require("colord");
var import_names = __toESM(require("colord/plugins/names"));
(0, import_colord.extend)([import_names.default]);
function getDefaultColors(palette) {
  if (!palette || palette.length < 2) {
    return ["#000", "#fff"];
  }
  return palette.map(({
    color
  }) => ({
    color,
    brightness: (0, import_colord.colord)(color).brightness()
  })).reduce(([min, max], current) => {
    return [current.brightness <= min.brightness ? current : min, current.brightness >= max.brightness ? current : max];
  }, [{
    brightness: 1,
    color: ""
  }, {
    brightness: 0,
    color: ""
  }]).map(({
    color
  }) => color);
}
function getGradientFromCSSColors(colors = [], angle = "90deg") {
  const l = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${i * l}%, ${c} ${(i + 1) * l}%`).join(", ");
  return `linear-gradient( ${angle}, ${stops} )`;
}
function getColorStopsFromColors(colors) {
  return colors.map((color, i) => ({
    position: i * 100 / (colors.length - 1),
    color
  }));
}
function getColorsFromColorStops(colorStops = []) {
  return colorStops.map(({
    color
  }) => color);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getColorStopsFromColors,
  getColorsFromColorStops,
  getDefaultColors,
  getGradientFromCSSColors
});
//# sourceMappingURL=utils.cjs.map

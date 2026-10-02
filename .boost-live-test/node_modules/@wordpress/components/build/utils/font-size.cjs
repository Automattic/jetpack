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

// packages/components/src/utils/font-size.ts
var font_size_exports = {};
__export(font_size_exports, {
  BASE_FONT_SIZE: () => BASE_FONT_SIZE,
  HEADING_FONT_SIZES: () => HEADING_FONT_SIZES,
  PRESET_FONT_SIZES: () => PRESET_FONT_SIZES,
  getFontSize: () => getFontSize,
  getHeadingFontSize: () => getHeadingFontSize
});
module.exports = __toCommonJS(font_size_exports);
var import_config_values = __toESM(require("./config-values.cjs"));
var BASE_FONT_SIZE = 13;
var PRESET_FONT_SIZES = {
  body: BASE_FONT_SIZE,
  caption: 10,
  footnote: 11,
  largeTitle: 28,
  subheadline: 12,
  title: 20
};
var HEADING_FONT_SIZES = [1, 2, 3, 4, 5, 6].flatMap((n) => [n, n.toString()]);
function getFontSize(size = BASE_FONT_SIZE) {
  if (size in PRESET_FONT_SIZES) {
    return getFontSize(PRESET_FONT_SIZES[size]);
  }
  if (typeof size !== "number") {
    const parsed = parseFloat(size);
    if (Number.isNaN(parsed)) {
      return size;
    }
    size = parsed;
  }
  const ratio = `(${size} / ${BASE_FONT_SIZE})`;
  return `calc(${ratio} * ${import_config_values.default.fontSize})`;
}
function getHeadingFontSize(size = 3) {
  if (!HEADING_FONT_SIZES.includes(size)) {
    return getFontSize(size);
  }
  const headingSize = `fontSizeH${size}`;
  return import_config_values.default[headingSize];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BASE_FONT_SIZE,
  HEADING_FONT_SIZES,
  PRESET_FONT_SIZES,
  getFontSize,
  getHeadingFontSize
});
//# sourceMappingURL=font-size.cjs.map

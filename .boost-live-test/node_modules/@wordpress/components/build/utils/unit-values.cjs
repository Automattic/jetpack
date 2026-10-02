"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/utils/unit-values.ts
var unit_values_exports = {};
__export(unit_values_exports, {
  createCSSUnitValue: () => createCSSUnitValue,
  parseCSSUnitValue: () => parseCSSUnitValue
});
module.exports = __toCommonJS(unit_values_exports);
var UNITED_VALUE_REGEX = /^([\d.\-+]*)\s*(fr|cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|vw|vh|vmin|vmax|%|cap|ic|rlh|vi|vb|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|svw|lvw|dvw|svh|lvh|dvh|svi|lvi|dvi|svb|lvb|dvb|svmin|lvmin|dvmin|svmax|lvmax|dvmax)?$/;
function parseCSSUnitValue(toParse) {
  const value = toParse.trim();
  const matched = value.match(UNITED_VALUE_REGEX);
  if (!matched) {
    return [void 0, void 0];
  }
  const [, num, unit] = matched;
  let numParsed = parseFloat(num);
  numParsed = Number.isNaN(numParsed) ? void 0 : numParsed;
  return [numParsed, unit];
}
function createCSSUnitValue(value, unit) {
  return `${value}${unit}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCSSUnitValue,
  parseCSSUnitValue
});
//# sourceMappingURL=unit-values.cjs.map

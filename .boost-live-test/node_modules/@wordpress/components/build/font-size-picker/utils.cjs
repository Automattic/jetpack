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

// packages/components/src/font-size-picker/utils.ts
var utils_exports = {};
__export(utils_exports, {
  generateFontSizeHint: () => generateFontSizeHint,
  isSimpleCssValue: () => isSimpleCssValue
});
module.exports = __toCommonJS(utils_exports);
function isSimpleCssValue(value) {
  const sizeRegex = /^[\d\.]+(px|em|rem|vw|vh|%|svw|lvw|dvw|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax)?$/i;
  return sizeRegex.test(String(value));
}
function generateFontSizeHint(fontSize) {
  if (fontSize.hint) {
    return fontSize.hint;
  }
  if (isSimpleCssValue(fontSize.size)) {
    return String(fontSize.size);
  }
  return void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateFontSizeHint,
  isSimpleCssValue
});
//# sourceMappingURL=utils.cjs.map

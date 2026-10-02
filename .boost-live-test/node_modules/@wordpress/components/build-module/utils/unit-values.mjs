// packages/components/src/utils/unit-values.ts
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
export {
  createCSSUnitValue,
  parseCSSUnitValue
};
//# sourceMappingURL=unit-values.mjs.map

// packages/components/src/utils/font-size.ts
import CONFIG from "./config-values.mjs";
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
  return `calc(${ratio} * ${CONFIG.fontSize})`;
}
function getHeadingFontSize(size = 3) {
  if (!HEADING_FONT_SIZES.includes(size)) {
    return getFontSize(size);
  }
  const headingSize = `fontSizeH${size}`;
  return CONFIG[headingSize];
}
export {
  BASE_FONT_SIZE,
  HEADING_FONT_SIZES,
  PRESET_FONT_SIZES,
  getFontSize,
  getHeadingFontSize
};
//# sourceMappingURL=font-size.mjs.map

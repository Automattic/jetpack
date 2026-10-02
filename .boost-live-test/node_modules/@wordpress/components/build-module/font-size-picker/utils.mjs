// packages/components/src/font-size-picker/utils.ts
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
export {
  generateFontSizeHint,
  isSimpleCssValue
};
//# sourceMappingURL=utils.mjs.map

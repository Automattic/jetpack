// packages/rich-text/src/slice.js
function slice(value, startIndex = value.start, endIndex = value.end) {
  const { formats, replacements, text } = value;
  if (startIndex === void 0 || endIndex === void 0) {
    return { ...value };
  }
  return {
    formats: formats.slice(startIndex, endIndex),
    replacements: replacements.slice(startIndex, endIndex),
    text: text.slice(startIndex, endIndex)
  };
}
export {
  slice
};
//# sourceMappingURL=slice.mjs.map

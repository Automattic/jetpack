// packages/dom/src/dom/get-range-height.js
function getRangeHeight(range) {
  const rects = Array.from(range.getClientRects());
  if (!rects.length) {
    return;
  }
  const highestTop = Math.min(...rects.map(({ top }) => top));
  const lowestBottom = Math.max(...rects.map(({ bottom }) => bottom));
  return lowestBottom - highestTop;
}
export {
  getRangeHeight as default
};
//# sourceMappingURL=get-range-height.mjs.map

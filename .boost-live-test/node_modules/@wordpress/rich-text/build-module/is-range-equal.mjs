// packages/rich-text/src/is-range-equal.js
function isRangeEqual(a, b) {
  return a === b || a && b && a.startContainer === b.startContainer && a.startOffset === b.startOffset && a.endContainer === b.endContainer && a.endOffset === b.endOffset;
}
export {
  isRangeEqual
};
//# sourceMappingURL=is-range-equal.mjs.map

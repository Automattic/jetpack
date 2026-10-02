// packages/dom/src/dom/scroll-if-no-range.js
function scrollIfNoRange(container, alignToTop, callback) {
  let range = callback();
  if (!range || !range.startContainer || !container.contains(range.startContainer)) {
    container.scrollIntoView(alignToTop);
    range = callback();
    if (!range || !range.startContainer || !container.contains(range.startContainer)) {
      return null;
    }
  }
  return range;
}
export {
  scrollIfNoRange
};
//# sourceMappingURL=scroll-if-no-range.mjs.map

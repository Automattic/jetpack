// packages/dom/src/dom/hidden-caret-range-from-point.js
import caretRangeFromPoint from "./caret-range-from-point.mjs";
import getComputedStyle from "./get-computed-style.mjs";
function hiddenCaretRangeFromPoint(doc, x, y, container) {
  const originalZIndex = container.style.zIndex;
  const originalPosition = container.style.position;
  const originalBorderRadius = container.style.borderRadius;
  const { position = "static" } = getComputedStyle(container);
  if (position === "static") {
    container.style.position = "relative";
  }
  container.style.zIndex = "10000";
  container.style.borderRadius = "0";
  const range = caretRangeFromPoint(doc, x, y);
  container.style.zIndex = originalZIndex;
  container.style.position = originalPosition;
  container.style.borderRadius = originalBorderRadius;
  return range;
}
export {
  hiddenCaretRangeFromPoint as default
};
//# sourceMappingURL=hidden-caret-range-from-point.mjs.map

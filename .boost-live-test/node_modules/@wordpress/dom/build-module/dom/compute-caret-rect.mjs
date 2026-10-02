// packages/dom/src/dom/compute-caret-rect.js
import getRectangleFromRange from "./get-rectangle-from-range.mjs";
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function computeCaretRect(win) {
  const selection = win.getSelection();
  assertIsDefined(selection, "selection");
  const range = selection.rangeCount ? selection.getRangeAt(0) : null;
  if (!range) {
    return null;
  }
  return getRectangleFromRange(range);
}
export {
  computeCaretRect as default
};
//# sourceMappingURL=compute-caret-rect.mjs.map

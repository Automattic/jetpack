// packages/dom/src/dom/document-has-text-selection.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function documentHasTextSelection(doc) {
  assertIsDefined(doc.defaultView, "doc.defaultView");
  const selection = doc.defaultView.getSelection();
  assertIsDefined(selection, "selection");
  const range = selection.rangeCount ? selection.getRangeAt(0) : null;
  return !!range && !range.collapsed;
}
export {
  documentHasTextSelection as default
};
//# sourceMappingURL=document-has-text-selection.mjs.map

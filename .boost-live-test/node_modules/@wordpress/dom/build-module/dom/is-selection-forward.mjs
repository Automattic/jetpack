// packages/dom/src/dom/is-selection-forward.js
import { assertIsDefined } from "../utils/assert-is-defined.mjs";
function isSelectionForward(selection) {
  const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
  assertIsDefined(anchorNode, "anchorNode");
  assertIsDefined(focusNode, "focusNode");
  const position = anchorNode.compareDocumentPosition(focusNode);
  if (position & anchorNode.DOCUMENT_POSITION_PRECEDING) {
    return false;
  }
  if (position & anchorNode.DOCUMENT_POSITION_FOLLOWING) {
    return true;
  }
  if (position === 0) {
    return anchorOffset <= focusOffset;
  }
  return true;
}
export {
  isSelectionForward as default
};
//# sourceMappingURL=is-selection-forward.mjs.map

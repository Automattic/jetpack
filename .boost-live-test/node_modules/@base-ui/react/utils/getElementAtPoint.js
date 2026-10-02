"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElementAtPoint = getElementAtPoint;
// `Document.elementFromPoint` retargets shadow content to the shadow host, which then fails
// `contains()` checks against a popup inside that shadow root, so callers pass `getRootNode()`
// (a document or a shadow root) rather than `ownerDocument()`.
function getElementAtPoint(root, x, y) {
  return typeof root?.elementFromPoint === 'function' ? root.elementFromPoint(x, y) : null;
}
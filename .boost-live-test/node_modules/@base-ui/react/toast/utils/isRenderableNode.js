"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasRenderableChildren = hasRenderableChildren;
exports.isRenderableNode = isRenderableNode;
var React = _interopRequireWildcard(require("react"));
function isRenderableNode(node) {
  if (node == null || typeof node === 'boolean' || node === '') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(isRenderableNode);
  }
  return true;
}
function hasRenderableChildren(element) {
  return /*#__PURE__*/React.isValidElement(element) && isRenderableNode(element.props.children);
}
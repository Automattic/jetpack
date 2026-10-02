import * as React from 'react';
export function isRenderableNode(node) {
  if (node == null || typeof node === 'boolean' || node === '') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(isRenderableNode);
  }
  return true;
}
export function hasRenderableChildren(element) {
  return /*#__PURE__*/React.isValidElement(element) && isRenderableNode(element.props.children);
}
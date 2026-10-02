"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findScrollableTouchTarget = findScrollableTouchTarget;
exports.hasScrollableAncestor = hasScrollableAncestor;
exports.isScrollable = isScrollable;
exports.isScrollableX = isScrollableX;
exports.isScrollableY = isScrollableY;
var _dom = require("@floating-ui/utils/dom");
function isScrollableY(element, allowOverflowIntent = false) {
  const {
    overflowY
  } = (0, _dom.getComputedStyle)(element);
  if (overflowY !== 'auto' && overflowY !== 'scroll') {
    return false;
  }
  // When `allowOverflowIntent` is true, a container that overflows only once extra space is
  // added (e.g. drawer keyboard scroll slack) still counts, as long as it has layout size on
  // the axis.
  return allowOverflowIntent ? element.clientHeight > 0 : element.scrollHeight > element.clientHeight;
}
function isScrollableX(element, allowOverflowIntent = false) {
  const {
    overflowX
  } = (0, _dom.getComputedStyle)(element);
  if (overflowX !== 'auto' && overflowX !== 'scroll') {
    return false;
  }
  return allowOverflowIntent ? element.clientWidth > 0 : element.scrollWidth > element.clientWidth;
}
function isScrollable(element, axis, allowOverflowIntent = false) {
  return axis === 'vertical' ? isScrollableY(element, allowOverflowIntent) : isScrollableX(element, allowOverflowIntent);
}
function hasScrollableAncestor(target, root, axes) {
  // `getParentNode` crosses shadow boundaries (and slots), so a target inside a shadow root
  // still walks up to scrollable ancestors in the light DOM.
  let node = target;
  while ((0, _dom.isHTMLElement)(node) && node !== root && !(0, _dom.isLastTraversableNode)(node)) {
    for (const axis of axes) {
      if (isScrollable(node, axis)) {
        return true;
      }
    }
    node = (0, _dom.getParentNode)(node);
  }
  return false;
}
function findScrollableTouchTarget(target, root, axis = 'vertical', allowOverflowIntent = false) {
  // `getParentNode` crosses shadow boundaries (and slots), so a target inside a shadow root
  // still reaches a scrollable ancestor in the light DOM.
  let node = (0, _dom.isHTMLElement)(target) ? target : null;
  while ((0, _dom.isHTMLElement)(node) && node !== root && !(0, _dom.isLastTraversableNode)(node)) {
    if (isScrollable(node, axis, allowOverflowIntent)) {
      return node;
    }
    node = (0, _dom.getParentNode)(node);
  }
  return isScrollable(root, axis, allowOverflowIntent) ? root : null;
}
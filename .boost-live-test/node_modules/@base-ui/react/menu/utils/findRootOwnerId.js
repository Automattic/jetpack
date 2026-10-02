"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findRootOwnerId = findRootOwnerId;
var _dom = require("@floating-ui/utils/dom");
function findRootOwnerId(node) {
  if ((0, _dom.isHTMLElement)(node) && node.hasAttribute('data-rootownerid')) {
    return node.getAttribute('data-rootownerid');
  }
  if ((0, _dom.isLastTraversableNode)(node)) {
    return undefined;
  }
  return findRootOwnerId((0, _dom.getParentNode)(node));
}
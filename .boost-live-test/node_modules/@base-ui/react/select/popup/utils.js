"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LIST_FUNCTIONAL_STYLES = void 0;
exports.clearStyles = clearStyles;
function clearStyles(element, originalStyles) {
  if (element) {
    Object.assign(element.style, originalStyles);
  }
}
const LIST_FUNCTIONAL_STYLES = exports.LIST_FUNCTIONAL_STYLES = {
  position: 'relative',
  maxHeight: '100%',
  overflowX: 'hidden',
  overflowY: 'auto'
};
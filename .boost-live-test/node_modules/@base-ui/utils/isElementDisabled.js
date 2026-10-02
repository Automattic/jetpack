"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isElementDisabled = isElementDisabled;
function isElementDisabled(element) {
  return element == null || element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
}
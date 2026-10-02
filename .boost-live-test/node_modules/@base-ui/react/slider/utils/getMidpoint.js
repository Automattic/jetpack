"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMidpoint = getMidpoint;
function getMidpoint(element, vertical) {
  const rect = element.getBoundingClientRect();
  return vertical ? (rect.top + rect.bottom) / 2 : (rect.left + rect.right) / 2;
}
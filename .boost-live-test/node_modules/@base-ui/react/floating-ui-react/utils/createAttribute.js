"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAttribute = createAttribute;
function createAttribute(name) {
  return `data-base-ui-${name}`;
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.inertValue = inertValue;
var _reactVersion = require("./reactVersion");
function inertValue(value) {
  if ((0, _reactVersion.isReactVersionAtLeast)(19)) {
    return value;
  }
  // compatibility with React < 19
  return value ? 'true' : undefined;
}
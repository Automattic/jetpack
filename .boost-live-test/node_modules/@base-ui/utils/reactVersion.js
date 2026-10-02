"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isReactVersionAtLeast = isReactVersionAtLeast;
var React = _interopRequireWildcard(require("react"));
const majorVersion = parseInt(React.version, 10);
function isReactVersionAtLeast(reactVersionToCheck) {
  return majorVersion >= reactVersionToCheck;
}
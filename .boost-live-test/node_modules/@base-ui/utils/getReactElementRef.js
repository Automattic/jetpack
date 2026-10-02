"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getReactElementRef = getReactElementRef;
var React = _interopRequireWildcard(require("react"));
var _reactVersion = require("./reactVersion");
/**
 * Extracts the `ref` from a React element, handling different React versions.
 */
function getReactElementRef(element) {
  if (! /*#__PURE__*/React.isValidElement(element)) {
    return null;
  }
  const reactElement = element;
  const propsWithRef = reactElement.props;
  return ((0, _reactVersion.isReactVersionAtLeast)(19) ? propsWithRef?.ref : reactElement.ref) ?? null;
}
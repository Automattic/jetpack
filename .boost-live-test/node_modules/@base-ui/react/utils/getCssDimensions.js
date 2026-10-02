"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCssDimensions = getCssDimensions;
var _utils = require("@floating-ui/utils");
var _dom = require("@floating-ui/utils/dom");
function getCssDimensions(element) {
  const css = (0, _dom.getComputedStyle)(element);
  // In testing environments, the `width` and `height` properties are empty
  // strings for SVG elements, returning NaN. Fallback to `0` in this case.
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = (0, _dom.isHTMLElement)(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = (0, _utils.round)(width) !== offsetWidth || (0, _utils.round)(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height
  };
}
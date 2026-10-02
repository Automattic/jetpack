"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSharedFixedSize = setSharedFixedSize;
var NavigationMenuPopupCssVars = _interopRequireWildcard(require("../popup/NavigationMenuPopupCssVars"));
var NavigationMenuPositionerCssVars = _interopRequireWildcard(require("../positioner/NavigationMenuPositionerCssVars"));
function setSharedFixedSize(popupElement, positionerElement, width, height) {
  popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${width}px`);
  popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${height}px`);
  positionerElement.style.setProperty(NavigationMenuPositionerCssVars.positionerWidth, `${width}px`);
  positionerElement.style.setProperty(NavigationMenuPositionerCssVars.positionerHeight, `${height}px`);
}
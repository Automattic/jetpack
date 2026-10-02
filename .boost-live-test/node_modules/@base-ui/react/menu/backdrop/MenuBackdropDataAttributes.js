"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.open = exports.endingStyle = exports.closed = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the menu is open.
 */
const open = exports.open = _popupStateMapping.CommonPopupDataAttributes.open;
/**
 * Present when the menu is closed.
 */
const closed = exports.closed = _popupStateMapping.CommonPopupDataAttributes.closed;
/**
 * Present when the menu begins animating in.
 */
const startingStyle = exports.startingStyle = _popupStateMapping.CommonPopupDataAttributes.startingStyle;
/**
 * Present when the menu is animating out.
 */
const endingStyle = exports.endingStyle = _popupStateMapping.CommonPopupDataAttributes.endingStyle;
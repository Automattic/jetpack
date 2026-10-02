"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pressed = exports.popupOpen = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the corresponding context menu is open.
 */
const popupOpen = exports.popupOpen = _popupStateMapping.CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the corresponding context menu is open.
 */
const pressed = exports.pressed = _popupStateMapping.CommonTriggerDataAttributes.pressed;
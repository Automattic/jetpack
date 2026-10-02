"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pressed = exports.popupOpen = exports.disabled = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the corresponding menu is open.
 */
const popupOpen = exports.popupOpen = _popupStateMapping.CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the trigger is pressed.
 */
const pressed = exports.pressed = _popupStateMapping.CommonTriggerDataAttributes.pressed;
/**
 * Present when the trigger is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.visible = exports.startingStyle = exports.popupOpen = exports.endingStyle = exports.disabled = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the corresponding popup is open.
 */
const popupOpen = exports.popupOpen = _popupStateMapping.CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the button is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the clear button is visible.
 */
const visible = exports.visible = 'data-visible';
/**
 * Present when the button begins animating in.
 */
const startingStyle = exports.startingStyle = _popupStateMapping.CommonPopupDataAttributes.startingStyle;
/**
 * Present when the button is animating out.
 */
const endingStyle = exports.endingStyle = _popupStateMapping.CommonPopupDataAttributes.endingStyle;
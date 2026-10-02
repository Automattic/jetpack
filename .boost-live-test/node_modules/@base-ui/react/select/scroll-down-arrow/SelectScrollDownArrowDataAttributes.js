"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.visible = exports.startingStyle = exports.side = exports.endingStyle = exports.direction = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the scroll arrow begins animating in.
 */
const startingStyle = exports.startingStyle = _popupStateMapping.CommonPopupDataAttributes.startingStyle;
/**
 * Present when the scroll arrow is animating out.
 */
const endingStyle = exports.endingStyle = _popupStateMapping.CommonPopupDataAttributes.endingStyle;
/**
 * Indicates the direction of the scroll arrow.
 * @type {'down'}
 */
const direction = exports.direction = 'data-direction';
/**
 * Present when the scroll arrow is visible.
 */
const visible = exports.visible = 'data-visible';
/**
 * Indicates which side the popup is positioned relative to the trigger.
 * @type {'none' | 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
const side = exports.side = _popupStateMapping.CommonPopupDataAttributes.side;
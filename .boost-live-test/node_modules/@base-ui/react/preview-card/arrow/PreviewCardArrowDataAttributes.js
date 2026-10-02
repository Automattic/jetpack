"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uncentered = exports.side = exports.open = exports.closed = exports.align = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the preview card is open.
 */
const open = exports.open = _popupStateMapping.CommonPopupDataAttributes.open;
/**
 * Present when the preview card is closed.
 */
const closed = exports.closed = _popupStateMapping.CommonPopupDataAttributes.closed;
/**
 * Indicates which side the popup is positioned relative to the trigger.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
const side = exports.side = _popupStateMapping.CommonPopupDataAttributes.side;
/**
 * Indicates how the popup is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
const align = exports.align = _popupStateMapping.CommonPopupDataAttributes.align;
/**
 * Present when the preview card arrow is uncentered.
 */
const uncentered = exports.uncentered = 'data-uncentered';
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.side = exports.open = exports.closed = exports.anchorHidden = exports.align = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the select popup is open.
 */
const open = exports.open = _popupStateMapping.CommonPopupDataAttributes.open;
/**
 * Present when the select popup is closed.
 */
const closed = exports.closed = _popupStateMapping.CommonPopupDataAttributes.closed;
/**
 * Present when the anchor is hidden.
 */
const anchorHidden = exports.anchorHidden = _popupStateMapping.CommonPopupDataAttributes.anchorHidden;
/**
 * Indicates which side the popup is positioned relative to the trigger.
 * @type {'none' | 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
const side = exports.side = _popupStateMapping.CommonPopupDataAttributes.side;
/**
 * Indicates how the popup is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
const align = exports.align = _popupStateMapping.CommonPopupDataAttributes.align;
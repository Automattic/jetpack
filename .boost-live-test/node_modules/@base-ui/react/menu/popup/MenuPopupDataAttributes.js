"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.side = exports.open = exports.instant = exports.endingStyle = exports.closed = exports.align = void 0;
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
/**
 * Indicates which side the popup is positioned relative to the anchor.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
const side = exports.side = _popupStateMapping.CommonPopupDataAttributes.side;
/**
 * Indicates how the popup is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
const align = exports.align = _popupStateMapping.CommonPopupDataAttributes.align;
/**
 * Present if animations should be instant.
 * @type {'click' | 'dismiss' | 'group' | 'trigger-change'}
 */
const instant = exports.instant = 'data-instant';
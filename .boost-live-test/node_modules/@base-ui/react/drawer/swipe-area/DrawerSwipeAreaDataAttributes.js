"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.swiping = exports.swipeDirection = exports.open = exports.disabled = exports.closed = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the drawer is open.
 */
const open = exports.open = _popupStateMapping.CommonPopupDataAttributes.open;
/**
 * Present when the drawer is closed.
 */
const closed = exports.closed = _popupStateMapping.CommonPopupDataAttributes.closed;
/**
 * Present when the swipe area is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Indicates the swipe direction.
 * @type {'up' | 'down' | 'left' | 'right'}
 */
const swipeDirection = exports.swipeDirection = 'data-swipe-direction';
/**
 * Present when the drawer is being swiped.
 */
const swiping = exports.swiping = 'data-swiping';
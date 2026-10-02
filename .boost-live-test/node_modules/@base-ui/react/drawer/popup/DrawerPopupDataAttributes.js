"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.swiping = exports.swipeDismiss = exports.swipeDirection = exports.startingStyle = exports.open = exports.nestedDrawerSwiping = exports.nestedDrawerOpen = exports.expanded = exports.endingStyle = exports.closed = void 0;
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
 * Present when the drawer begins animating in.
 */
const startingStyle = exports.startingStyle = _popupStateMapping.CommonPopupDataAttributes.startingStyle;
/**
 * Present when the drawer is animating out.
 */
const endingStyle = exports.endingStyle = _popupStateMapping.CommonPopupDataAttributes.endingStyle;
/**
 * Present when the drawer is at the expanded (full-height) snap point.
 */
const expanded = exports.expanded = 'data-expanded';
/**
 * Present when a nested drawer is open.
 */
const nestedDrawerOpen = exports.nestedDrawerOpen = 'data-nested-drawer-open';
/**
 * Present when a nested drawer is being swiped.
 */
const nestedDrawerSwiping = exports.nestedDrawerSwiping = 'data-nested-drawer-swiping';
/**
 * Present when the drawer is dismissed by swiping.
 */
const swipeDismiss = exports.swipeDismiss = 'data-swipe-dismiss';
/**
 * Indicates the swipe direction.
 * @type {'up' | 'down' | 'left' | 'right'}
 */
const swipeDirection = exports.swipeDirection = 'data-swipe-direction';
/**
 * Present when the drawer is being swiped.
 */
const swiping = exports.swiping = 'data-swiping';
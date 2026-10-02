"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.open = exports.endingStyle = exports.closed = exports.activationDirection = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the popup is open.
 */
const open = exports.open = _popupStateMapping.CommonPopupDataAttributes.open;
/**
 * Present when the popup is closed.
 */
const closed = exports.closed = _popupStateMapping.CommonPopupDataAttributes.closed;
/**
 * Present when the content begins animating in.
 */
const startingStyle = exports.startingStyle = _popupStateMapping.CommonPopupDataAttributes.startingStyle;
/**
 * Present when the content is animating out.
 */
const endingStyle = exports.endingStyle = _popupStateMapping.CommonPopupDataAttributes.endingStyle;
/**
 * Which direction another trigger was activated from.
 * @type {'left' | 'right' | 'up' | 'down'}
 */
const activationDirection = exports.activationDirection = 'data-activation-direction';
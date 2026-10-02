"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uncentered = exports.side = exports.align = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Indicates which side the toast is positioned relative to the anchor.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
const side = exports.side = _popupStateMapping.CommonPopupDataAttributes.side;
/**
 * Indicates how the toast is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
const align = exports.align = _popupStateMapping.CommonPopupDataAttributes.align;
/**
 * Present when the toast arrow is uncentered.
 */
const uncentered = exports.uncentered = 'data-uncentered';